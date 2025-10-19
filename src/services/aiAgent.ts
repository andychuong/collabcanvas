import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Shape, ShapeType, ShapeHistoryEntry } from '../types';
import { hexToRgba } from '../utils/colors';

interface AIAgentContext {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  batchUpdateShapes?: (shapes: Shape[]) => void;
  deleteShape: (shapeId: string) => void;
  getShapeHistory?: (shapeId: string) => Promise<ShapeHistoryEntry[]>;
  restoreShapeVersion?: (entry: ShapeHistoryEntry) => Promise<void>;
  userId: string;
  canvasWidth: number;
  canvasHeight: number;
}

export class CanvasAIAgent {
  private model: ChatOpenAI;
  private context: AIAgentContext;

  constructor(apiKey: string, context: AIAgentContext) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key is required. Please provide your API key in the settings.');
    }

    this.model = new ChatOpenAI({
      apiKey: apiKey,
      modelName: 'gpt-4o',
      temperature: 0.1,
    });
    this.context = context;
  }

  // Helper function to parse color names or hex codes
  private parseColor(colorStr: string): string {
    const colorMap: Record<string, string> = {
      red: '#FF0000',
      blue: '#0000FF',
      green: '#00FF00',
      yellow: '#FFFF00',
      orange: '#FFA500',
      purple: '#800080',
      pink: '#FFC0CB',
      black: '#000000',
      white: '#FFFFFF',
      gray: '#808080',
      grey: '#808080',
      'dark gray': '#4B5563',
      'darkgray': '#4B5563',
      'dark grey': '#4B5563',
      'darkgrey': '#4B5563',
    };

    const normalized = colorStr.toLowerCase().trim();
    return colorMap[normalized] || (colorStr.startsWith('#') ? colorStr : '#000000');
  }

  // Helper to find shapes by description
  private findShapesByDescription(description: string): Shape[] {
    const desc = description.toLowerCase();
    
    console.log(`[findShapes] Searching for: "${description}"`);
    console.log(`[findShapes] Total shapes on canvas:`, this.context.shapes.length);
    
    // Check if description is searching for text content (e.g., "text that says Login", "Login text")
    const textContentPatterns = [
      /text.*(?:that says|saying|with|contains?)\s+"?([^"]+)"?/i,
      /text.*"([^"]+)"/i,
      /"([^"]+)".*text/i,
    ];
    
    let textContentSearch: string | null = null;
    for (const pattern of textContentPatterns) {
      const match = description.match(pattern);
      if (match) {
        textContentSearch = match[1].toLowerCase().trim();
        console.log(`[findShapes] Detected text content search: "${textContentSearch}"`);
        break;
      }
    }
    
    const matches = this.context.shapes.filter(shape => {
      let typeMatches = false;
      let colorMatches = false;
      let hasTypeInDesc = false;
      let hasColorInDesc = false;
      
      // If searching for specific text content, check if this text shape contains it
      if (textContentSearch && shape.type === 'text' && shape.text) {
        const shapeTextLower = shape.text.toLowerCase();
        // Check for exact match or partial match
        if (shapeTextLower.includes(textContentSearch) || textContentSearch.includes(shapeTextLower)) {
          console.log(`[findShapes] Shape ${shape.id.substring(0, 8)}: Text content match! "${shape.text}" matches search "${textContentSearch}"`);
          return true; // Return immediately for text content matches
        }
      }
      
      // Check if description mentions a type
      const types: ShapeType[] = ['rectangle', 'circle', 'text', 'line'];
      for (const type of types) {
        if (desc.includes(type)) {
          hasTypeInDesc = true;
          if (shape.type === type) {
            typeMatches = true;
          }
          break;
        }
      }
      
      // Check if description mentions a color
      const shapeColor = shape.stroke || shape.fill;
      if (shapeColor) {
        const colorNames = Object.entries({
          red: '#FF0000', blue: '#0000FF', green: '#00FF00',
          yellow: '#FFFF00', orange: '#FFA500', purple: '#800080',
          pink: '#FFC0CB', black: '#000000', white: '#FFFFFF',
          gray: '#808080', 'dark gray': '#4B5563',
        });
        
        for (const [name, hex] of colorNames) {
          if (desc.includes(name)) {
            hasColorInDesc = true;
            const colorMatch = shapeColor.toUpperCase().includes(hex.substring(0, 7).toUpperCase());
            if (colorMatch) {
              colorMatches = true;
            }
            break;
          }
        }
      }
      
      // Fallback: Match by simple text content (if not already matched above)
      if (shape.text && desc.includes(shape.text.toLowerCase())) {
        console.log(`[findShapes] Shape ${shape.id.substring(0, 8)}: Matched by simple text inclusion`);
        return true;
      }
      
      const shouldInclude = (() => {
        // If both type and color are specified, both must match
        if (hasTypeInDesc && hasColorInDesc) {
          return typeMatches && colorMatches;
        }
        
        // If only type is specified, type must match
        if (hasTypeInDesc) {
          return typeMatches;
        }
        
        // If only color is specified, color must match
        if (hasColorInDesc) {
          return colorMatches;
        }
        
        return false;
      })();
      
      console.log(`[findShapes] Shape ${shape.id.substring(0, 8)}: type=${shape.type}, hasTypeInDesc=${hasTypeInDesc}, typeMatches=${typeMatches}, hasColorInDesc=${hasColorInDesc}, colorMatches=${colorMatches}, INCLUDE=${shouldInclude}`);
      
      return shouldInclude;
    });
    
    console.log(`[findShapes] Found ${matches.length} matching shapes`);
    
    // Sort by creation time (newest first) to prefer recently created shapes
    // This prevents accidentally grabbing old shapes when creating new forms
    matches.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`[findShapes] Sorted by recency. Newest: ${matches[0]?.id.substring(0, 8)} created ${Date.now() - (matches[0]?.createdAt || 0)}ms ago`);
    
    return matches;
  }

  private createTools(): DynamicStructuredTool[] {
    // Tool 1: Create a circle
    const createCircleTool = new DynamicStructuredTool({
      name: 'create_circle',
      description: 'Creates a circle shape on the canvas at a specific position with a given radius and color',
      schema: z.object({
        x: z.number().describe('The x coordinate (horizontal position)'),
        y: z.number().describe('The y coordinate (vertical position)'),
        radius: z.number().default(50).describe('The radius of the circle in pixels'),
        color: z.string().default('black').describe('The color of the circle (e.g., "red", "#FF0000")'),
        fillColor: z.string().optional().describe('Optional fill color for the circle'),
      }),
      func: async ({ x, y, radius, color, fillColor }) => {
        const shape: Shape = {
          id: uuidv4(),
          type: 'circle',
          x,
          y,
          radius,
          stroke: this.parseColor(color),
          strokeWidth: 2,
          fill: fillColor ? hexToRgba(this.parseColor(fillColor), 0.1) : hexToRgba('#D0D0D0', 0.1),
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.context.addShape(shape);
        return `Created a ${color} circle at position (${x}, ${y}) with radius ${radius}`;
      },
    });

    // Tool 2: Create a rectangle
    const createRectangleTool = new DynamicStructuredTool({
      name: 'create_rectangle',
      description: 'Creates a rectangle shape on the canvas with specified dimensions and position',
      schema: z.object({
        x: z.number().describe('The x coordinate (center of rectangle)'),
        y: z.number().describe('The y coordinate (center of rectangle)'),
        width: z.number().default(100).describe('The width of the rectangle in pixels'),
        height: z.number().default(100).describe('The height of the rectangle in pixels'),
        color: z.string().default('black').describe('The border color of the rectangle'),
        fillColor: z.string().optional().describe('Optional fill color for the rectangle'),
        rotation: z.number().default(0).describe('Rotation angle in degrees'),
      }),
      func: async ({ x, y, width, height, color, fillColor, rotation }) => {
        const shape: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x,
          y,
          width,
          height,
          stroke: this.parseColor(color),
          strokeWidth: 2,
          fill: fillColor ? hexToRgba(this.parseColor(fillColor), 0.1) : hexToRgba('#D0D0D0', 0.1),
          rotation,
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.context.addShape(shape);
        return `Created a ${color} rectangle at position (${x}, ${y}) with dimensions ${width}x${height}`;
      },
    });

    // Tool 3: Create text
    const createTextTool = new DynamicStructuredTool({
      name: 'create_text',
      description: 'Creates a text element on the canvas with specified content and styling',
      schema: z.object({
        text: z.string().describe('The text content to display'),
        x: z.number().describe('The x coordinate'),
        y: z.number().describe('The y coordinate'),
        fontSize: z.number().default(24).describe('Font size in pixels'),
        color: z.string().default('black').describe('Text color'),
        fontWeight: z.enum(['normal', 'bold']).default('normal').describe('Font weight'),
        fontFamily: z.string().default('Arial').describe('Font family'),
      }),
      func: async ({ text, x, y, fontSize, color, fontWeight, fontFamily }) => {
        const shape: Shape = {
          id: uuidv4(),
          type: 'text',
          x,
          y,
          text,
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: this.parseColor(color),
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.context.addShape(shape);
        return `Created text "${text}" at position (${x}, ${y}) with font size ${fontSize}`;
      },
    });

    // Tool 4: Create a line
    const createLineTool = new DynamicStructuredTool({
      name: 'create_line',
      description: 'Creates a line from one point to another',
      schema: z.object({
        x1: z.number().describe('Starting x coordinate'),
        y1: z.number().describe('Starting y coordinate'),
        x2: z.number().describe('Ending x coordinate'),
        y2: z.number().describe('Ending y coordinate'),
        color: z.string().default('black').describe('Line color'),
        strokeWidth: z.number().default(2).describe('Line thickness in pixels'),
      }),
      func: async ({ x1, y1, x2, y2, color, strokeWidth }) => {
        const shape: Shape = {
          id: uuidv4(),
          type: 'line',
          x: x1,
          y: y1,
          points: [0, 0, x2 - x1, y2 - y1],
          stroke: this.parseColor(color),
          strokeWidth,
          fill: '',
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.context.addShape(shape);
        return `Created a ${color} line from (${x1}, ${y1}) to (${x2}, ${y2})`;
      },
    });

    // Tool 5: Move shapes (absolute position)
    const moveShapeTool = new DynamicStructuredTool({
      name: 'move_shape',
      description: 'Moves a shape to an absolute position on the canvas. For relative movements (e.g., "100 pixels left"), use move_shape_relative instead.',
      schema: z.object({
        description: z.string().describe('Description of the shape to move (e.g., "red circle", "rectangle", "text with Hello")'),
        x: z.number().describe('Absolute x coordinate on canvas'),
        y: z.number().describe('Absolute y coordinate on canvas'),
      }),
      func: async ({ description, x, y }) => {
        const shapes = this.findShapesByDescription(description);
        console.log(`move_shape: Found ${shapes.length} shapes matching "${description}"`);
        
        if (shapes.length === 0) {
          return `No shapes found matching "${description}". Available shapes: ${this.context.shapes.map(s => `${s.type} (${s.stroke || s.fill})`).join(', ')}`;
        }
        
        const shape = shapes[0];
        console.log(`move_shape: Moving shape ID ${shape.id}, type: ${shape.type} from (${shape.x}, ${shape.y}) to (${x}, ${y})`);
        
        const updatedShape: Shape = {
          ...shape,
          x,
          y,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Moved ${shape.type} from (${shape.x}, ${shape.y}) to (${x}, ${y})`;
      },
    });

    // Tool 5b: Move shapes relatively
    const moveShapeRelativeTool = new DynamicStructuredTool({
      name: 'move_shape_relative',
      description: 'Moves a shape by a relative offset (e.g., "100 pixels left" means dx=-100, dy=0). Use this for relative movements.',
      schema: z.object({
        description: z.string().describe('Description of the shape to move'),
        dx: z.number().describe('Pixels to move horizontally (negative = left, positive = right)'),
        dy: z.number().describe('Pixels to move vertically (negative = up, positive = down)'),
      }),
      func: async ({ description, dx, dy }) => {
        const shapes = this.findShapesByDescription(description);
        console.log(`move_shape_relative: Found ${shapes.length} shapes matching "${description}"`);
        
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const newX = shape.x + dx;
        const newY = shape.y + dy;
        
        console.log(`move_shape_relative: Moving ${shape.type} from (${shape.x}, ${shape.y}) by (${dx}, ${dy}) to (${newX}, ${newY})`);
        
        const updatedShape: Shape = {
          ...shape,
          x: newX,
          y: newY,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Moved ${shape.type} ${dx < 0 ? 'left' : 'right'} by ${Math.abs(dx)} pixels${dy !== 0 ? ` and ${dy < 0 ? 'up' : 'down'} by ${Math.abs(dy)} pixels` : ''}. New position: (${newX}, ${newY})`;
      },
    });

    // Tool 5c: Move multiple shapes
    const moveMultipleShapesTool = new DynamicStructuredTool({
      name: 'move_multiple_shapes',
      description: 'BATCH OPERATION: Moves multiple shapes (2-100+) at once in a single call. ALWAYS use this instead of calling move_shape_relative repeatedly. Use count parameter to move a specific number.',
      schema: z.object({
        description: z.string().describe('Description that matches multiple shapes (e.g., "blue circles", "all circles")'),
        dx: z.number().describe('Pixels to move horizontally (negative = left, positive = right)'),
        dy: z.number().describe('Pixels to move vertically (negative = up, positive = down)'),
        count: z.number().optional().describe('Number of shapes to move (moves first N matches)'),
      }),
      func: async ({ description, dx, dy, count }) => {
        const shapes = this.findShapesByDescription(description);
        
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shapesToMove = count ? shapes.slice(0, count) : shapes;
        
        // Use a single timestamp for all updates to maintain consistency
        const timestamp = Date.now();
        
        // Create updated shapes
        const updatedShapes = shapesToMove.map(shape => ({
          ...shape,
          x: shape.x + dx,
          y: shape.y + dy,
          updatedAt: timestamp,
        }));
        
        // Use batch update if available (more efficient), otherwise parallel individual updates
        if (this.context.batchUpdateShapes && updatedShapes.length > 5) {
          await this.context.batchUpdateShapes(updatedShapes);
        } else {
          // Parallel individual updates for smaller batches
          await Promise.all(updatedShapes.map(shape => this.context.updateShape(shape)));
        }
        
        return `Moved ${shapesToMove.length} shapes matching "${description}" by (${dx}, ${dy})`;
      },
    });

    // Tool 6: Resize shape
    const resizeShapeTool = new DynamicStructuredTool({
      name: 'resize_shape',
      description: 'Resizes a shape by changing its dimensions or radius',
      schema: z.object({
        description: z.string().describe('Description of the shape to resize'),
        scaleFactor: z.number().optional().describe('Scale factor (e.g., 2 for twice as big, 0.5 for half size)'),
        width: z.number().optional().describe('New width (for rectangles)'),
        height: z.number().optional().describe('New height (for rectangles)'),
        radius: z.number().optional().describe('New radius (for circles)'),
      }),
      func: async ({ description, scaleFactor, width, height, radius }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const updatedShape: Shape = { ...shape, updatedAt: Date.now() };
        
        if (shape.type === 'circle' && (radius !== undefined || scaleFactor !== undefined)) {
          updatedShape.radius = radius || (shape.radius || 50) * (scaleFactor || 1);
        } else if (shape.type === 'rectangle') {
          if (scaleFactor !== undefined) {
            updatedShape.width = (shape.width || 100) * scaleFactor;
            updatedShape.height = (shape.height || 100) * scaleFactor;
          } else {
            if (width !== undefined) updatedShape.width = width;
            if (height !== undefined) updatedShape.height = height;
          }
        }
        
        this.context.updateShape(updatedShape);
        return `Resized ${shape.type}`;
      },
    });

    // Tool 7: Rotate shape
    const rotateShapeTool = new DynamicStructuredTool({
      name: 'rotate_shape',
      description: 'Rotates a rectangle shape by a specified angle',
      schema: z.object({
        description: z.string().describe('Description of the shape to rotate'),
        degrees: z.number().describe('Rotation angle in degrees (positive for clockwise, negative for counterclockwise)'),
      }),
      func: async ({ description, degrees }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        if (shape.type !== 'rectangle') {
          return `Can only rotate rectangles`;
        }
        
        const currentRotation = shape.rotation || 0;
        const updatedShape: Shape = {
          ...shape,
          rotation: currentRotation + degrees,
          updatedAt: Date.now(),
        };
        
        this.context.updateShape(updatedShape);
        return `Rotated ${shape.type} by ${degrees} degrees`;
      },
    });

    // Tool 8: Arrange shapes horizontally
    const arrangeHorizontalTool = new DynamicStructuredTool({
      name: 'arrange_horizontal',
      description: 'Arranges multiple shapes in a horizontal row with even spacing',
      schema: z.object({
        startX: z.number().describe('Starting x position'),
        y: z.number().describe('Y position for all shapes'),
        spacing: z.number().default(100).describe('Space between shapes in pixels'),
        count: z.number().describe('Number of shapes to arrange (uses last N created shapes)'),
      }),
      func: async ({ startX, y, spacing, count }) => {
        const recentShapes = this.context.shapes.slice(-count);
        
        recentShapes.forEach((shape, index) => {
          const updatedShape: Shape = {
            ...shape,
            x: startX + (index * spacing),
            y,
            updatedAt: Date.now(),
          };
          this.context.updateShape(updatedShape);
        });
        
        return `Arranged ${count} shapes horizontally starting at (${startX}, ${y})`;
      },
    });

    // Tool 9: Create a grid
    const createGridTool = new DynamicStructuredTool({
      name: 'create_grid',
      description: 'Creates a grid of shapes (squares by default)',
      schema: z.object({
        rows: z.number().describe('Number of rows'),
        cols: z.number().describe('Number of columns'),
        startX: z.number().describe('Starting x position'),
        startY: z.number().describe('Starting y position'),
        cellSize: z.number().default(60).describe('Size of each cell in pixels'),
        spacing: z.number().default(10).describe('Space between cells in pixels'),
        color: z.string().default('black').describe('Color of the grid shapes'),
      }),
      func: async ({ rows, cols, startX, startY, cellSize, spacing, color }) => {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = startX + col * (cellSize + spacing) + cellSize / 2;
            const y = startY + row * (cellSize + spacing) + cellSize / 2;
            
            const shape: Shape = {
              id: uuidv4(),
              type: 'rectangle',
              x,
              y,
              width: cellSize,
              height: cellSize,
              stroke: this.parseColor(color),
              strokeWidth: 2,
              fill: hexToRgba('#D0D0D0', 0.1),
              zIndex: 0,
              createdBy: this.context.userId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            this.context.addShape(shape);
          }
        }
        
        return `Created a ${rows}x${cols} grid of ${color} squares`;
      },
    });

    // Tool 10: Create multiple circles
    const createMultipleCirclesTool = new DynamicStructuredTool({
      name: 'create_multiple_circles',
      description: 'BATCH OPERATION: Creates multiple circles at once (5-100+) in a single call. ALWAYS use this instead of calling create_circle repeatedly. Supports grid, row, column, or random patterns.',
      schema: z.object({
        count: z.number().describe('Number of circles to create'),
        startX: z.number().describe('Starting X position'),
        startY: z.number().describe('Starting Y position'),
        spacing: z.number().default(80).describe('Space between circles'),
        pattern: z.enum(['grid', 'row', 'column', 'random']).default('grid').describe('How to arrange the circles'),
        color: z.string().default('blue').describe('Color of all circles'),
        radius: z.number().default(30).describe('Radius of each circle'),
      }),
      func: async ({ count, startX, startY, spacing, pattern, color, radius }) => {
        const cols = Math.ceil(Math.sqrt(count));
        const createdIds: string[] = [];
        const baseTimestamp = Date.now();
        
        // Create all shapes and batch the Firebase writes
        const createPromises = [];
        
        for (let i = 0; i < count; i++) {
          let x = startX;
          let y = startY;
          
          if (pattern === 'grid') {
            const row = Math.floor(i / cols);
            const col = i % cols;
            x = startX + col * spacing;
            y = startY + row * spacing;
          } else if (pattern === 'row') {
            x = startX + i * spacing;
            y = startY;
          } else if (pattern === 'column') {
            x = startX;
            y = startY + i * spacing;
          } else if (pattern === 'random') {
            x = startX + Math.random() * spacing * 5;
            y = startY + Math.random() * spacing * 5;
          }
          
          const shape: Shape = {
            id: uuidv4(),
            type: 'circle',
            x,
            y,
            radius,
            stroke: this.parseColor(color),
            strokeWidth: 2,
            fill: hexToRgba(this.parseColor(color), 0.1),
            zIndex: 0,
            createdBy: this.context.userId,
            createdAt: baseTimestamp + i, // Slight offset for ordering
            updatedAt: baseTimestamp + i,
          };
          
          // Add shape asynchronously (parallel execution)
          createPromises.push(this.context.addShape(shape));
          createdIds.push(shape.id);
        }
        
        // Wait for all shapes to be created (but they execute in parallel)
        await Promise.all(createPromises);
        
        return `Created ${count} ${color} circles in ${pattern} pattern starting at (${startX}, ${startY})`;
      },
    });

    // Tool 11: Delete shape
    const deleteShapeTool = new DynamicStructuredTool({
      name: 'delete_shape',
      description: 'Deletes a shape from the canvas',
      schema: z.object({
        description: z.string().describe('Description of the shape to delete'),
      }),
      func: async ({ description }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        this.context.deleteShape(shape.id);
        return `Deleted ${shape.type}`;
      },
    });

    // Tool 11: Get canvas info
    const getCanvasInfoTool = new DynamicStructuredTool({
      name: 'get_canvas_info',
      description: 'Gets information about the current canvas state, including all shapes and their positions',
      schema: z.object({
        includePositions: z.boolean().default(false).describe('Whether to include detailed position information'),
      }),
      func: async ({ includePositions }) => {
        const shapeCount = this.context.shapes.length;
        const shapeTypes = this.context.shapes.reduce((acc, shape) => {
          acc[shape.type] = (acc[shape.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        let info = `Canvas dimensions: ${this.context.canvasWidth}x${this.context.canvasHeight}. `;
        info += `Total shapes: ${shapeCount}. Types: ${JSON.stringify(shapeTypes)}.`;
        
        if (includePositions) {
          info += '\n\nShapes on canvas:\n';
          this.context.shapes.forEach((shape, idx) => {
            const color = shape.stroke || shape.fill;
            info += `${idx + 1}. ${shape.type} at (${Math.round(shape.x)}, ${Math.round(shape.y)}) - color: ${color}`;
            if (shape.width) info += `, size: ${Math.round(shape.width)}x${Math.round(shape.height || 0)}`;
            if (shape.radius) info += `, radius: ${Math.round(shape.radius)}`;
            if (shape.text) info += `, text: "${shape.text}"`;
            info += '\n';
          });
        }
        
        return info;
      },
    });

    // Tool 12: Find blank space
    const findBlankSpaceTool = new DynamicStructuredTool({
      name: 'find_blank_space',
      description: 'Finds available blank space on the canvas for placing new shapes. Returns coordinates for empty areas.',
      schema: z.object({
        width: z.number().default(100).describe('Desired width of space needed'),
        height: z.number().default(100).describe('Desired height of space needed'),
        preferredRegion: z.enum(['center', 'top', 'bottom', 'left', 'right', 'any']).default('any').describe('Preferred region of canvas'),
      }),
      func: async ({ width, height, preferredRegion }) => {
        const canvasW = this.context.canvasWidth;
        const canvasH = this.context.canvasHeight;
        
        // Helper to check if a position overlaps with existing shapes
        const overlapsWithShape = (x: number, y: number, w: number, h: number): boolean => {
          return this.context.shapes.some(shape => {
            const shapeW = shape.width || shape.radius || 50;
            const shapeH = shape.height || shape.radius || 50;
            
            // Check bounding box overlap
            return !(
              x + w / 2 < shape.x - shapeW / 2 ||
              x - w / 2 > shape.x + shapeW / 2 ||
              y + h / 2 < shape.y - shapeH / 2 ||
              y - h / 2 > shape.y + shapeH / 2
            );
          });
        };
        
        // Define search regions based on preference
        let searchRegions: Array<{x: number, y: number, name: string}> = [];
        
        switch (preferredRegion) {
          case 'center':
            searchRegions = [{ x: canvasW / 2, y: canvasH / 2, name: 'center' }];
            break;
          case 'top':
            searchRegions = [
              { x: canvasW / 2, y: canvasH * 0.2, name: 'top-center' },
              { x: canvasW * 0.3, y: canvasH * 0.2, name: 'top-left' },
              { x: canvasW * 0.7, y: canvasH * 0.2, name: 'top-right' },
            ];
            break;
          case 'bottom':
            searchRegions = [
              { x: canvasW / 2, y: canvasH * 0.8, name: 'bottom-center' },
              { x: canvasW * 0.3, y: canvasH * 0.8, name: 'bottom-left' },
              { x: canvasW * 0.7, y: canvasH * 0.8, name: 'bottom-right' },
            ];
            break;
          case 'left':
            searchRegions = [
              { x: canvasW * 0.2, y: canvasH / 2, name: 'left-center' },
              { x: canvasW * 0.2, y: canvasH * 0.3, name: 'left-top' },
              { x: canvasW * 0.2, y: canvasH * 0.7, name: 'left-bottom' },
            ];
            break;
          case 'right':
            searchRegions = [
              { x: canvasW * 0.8, y: canvasH / 2, name: 'right-center' },
              { x: canvasW * 0.8, y: canvasH * 0.3, name: 'right-top' },
              { x: canvasW * 0.8, y: canvasH * 0.7, name: 'right-bottom' },
            ];
            break;
          default: // 'any'
            searchRegions = [
              { x: canvasW / 2, y: canvasH / 2, name: 'center' },
              { x: canvasW * 0.3, y: canvasH * 0.3, name: 'top-left' },
              { x: canvasW * 0.7, y: canvasH * 0.3, name: 'top-right' },
              { x: canvasW * 0.3, y: canvasH * 0.7, name: 'bottom-left' },
              { x: canvasW * 0.7, y: canvasH * 0.7, name: 'bottom-right' },
            ];
        }
        
        // Find first blank region
        for (const region of searchRegions) {
          if (!overlapsWithShape(region.x, region.y, width, height)) {
            return `Found blank space at ${region.name}: position (${Math.round(region.x)}, ${Math.round(region.y)}). This area is clear for placing a ${width}x${height} shape.`;
          }
        }
        
        // If all preferred regions are occupied, find ANY blank space
        for (let y = height / 2; y < canvasH - height / 2; y += 50) {
          for (let x = width / 2; x < canvasW - width / 2; x += 50) {
            if (!overlapsWithShape(x, y, width, height)) {
              return `Found blank space at position (${Math.round(x)}, ${Math.round(y)}). This area can fit a ${width}x${height} shape.`;
            }
          }
        }
        
        return `Canvas is quite full. Suggested position for new shape: (${Math.round(canvasW / 2)}, ${Math.round(canvasH / 2)}) - may overlap with existing shapes.`;
      },
    });

    // Tool 13: Bring to Front
    const bringToFrontTool = new DynamicStructuredTool({
      name: 'bring_to_front',
      description: 'Brings a shape to the front layer (top of stacking order)',
      schema: z.object({
        description: z.string().describe('Description of the shape to bring to front'),
      }),
      func: async ({ description }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const maxZIndex = Math.max(...this.context.shapes.map(s => s.zIndex || 0), 0);
        
        const updatedShape: Shape = {
          ...shape,
          zIndex: maxZIndex + 1,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Brought ${shape.type} to front (zIndex: ${maxZIndex + 1})`;
      },
    });

    // Tool 14: Send to Back
    const sendToBackTool = new DynamicStructuredTool({
      name: 'send_to_back',
      description: 'Sends a shape to the back layer (bottom of stacking order)',
      schema: z.object({
        description: z.string().describe('Description of the shape to send to back'),
      }),
      func: async ({ description }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const minZIndex = Math.min(...this.context.shapes.map(s => s.zIndex || 0), 0);
        
        const updatedShape: Shape = {
          ...shape,
          zIndex: minZIndex - 1,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Sent ${shape.type} to back (zIndex: ${minZIndex - 1})`;
      },
    });

    // Tool 15: Bring Forward
    const bringForwardTool = new DynamicStructuredTool({
      name: 'bring_forward',
      description: 'Brings a shape forward one layer in the stacking order',
      schema: z.object({
        description: z.string().describe('Description of the shape to bring forward'),
      }),
      func: async ({ description }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const currentZ = shape.zIndex || 0;
        
        const updatedShape: Shape = {
          ...shape,
          zIndex: currentZ + 1,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Brought ${shape.type} forward one layer (zIndex: ${currentZ} → ${currentZ + 1})`;
      },
    });

    // Tool 16: Send Backward
    const sendBackwardTool = new DynamicStructuredTool({
      name: 'send_backward',
      description: 'Sends a shape backward one layer in the stacking order',
      schema: z.object({
        description: z.string().describe('Description of the shape to send backward'),
      }),
      func: async ({ description }) => {
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const currentZ = shape.zIndex || 0;
        
        const updatedShape: Shape = {
          ...shape,
          zIndex: currentZ - 1,
          updatedAt: Date.now(),
        };
        this.context.updateShape(updatedShape);
        return `Sent ${shape.type} backward one layer (zIndex: ${currentZ} → ${currentZ - 1})`;
      },
    });

    // Tool 17: Align text to shape
    const alignTextToShapeTool = new DynamicStructuredTool({
      name: 'align_text_to_shape',
      description: 'Aligns a text element to a shape. Use ONLY for text you just created in the same command. Be very specific about which text (use exact text content in quotes).',
      schema: z.object({
        textDescription: z.string().describe('SPECIFIC description of the text to align - use exact text content in quotes like "text that says Username"'),
        shapeDescription: z.string().describe('Description of the shape to align to'),
        alignment: z.enum(['center', 'top', 'bottom', 'left', 'right', 'left-center']).default('center').describe('How to align the text'),
      }),
      func: async ({ textDescription, shapeDescription, alignment }) => {
        console.log(`[align_text] Searching for text: "${textDescription}"`);
        console.log(`[align_text] Searching for shape: "${shapeDescription}"`);
        
        const textShapes = this.findShapesByDescription(textDescription);
        const targetShapes = this.findShapesByDescription(shapeDescription);
        
        console.log(`[align_text] Found ${textShapes.length} text matches, ${targetShapes.length} shape matches`);
        
        if (textShapes.length === 0) {
          return `No text found matching "${textDescription}"`;
        }
        if (targetShapes.length === 0) {
          return `No shape found matching "${shapeDescription}"`;
        }
        
        const textShape = textShapes[0];
        const targetShape = targetShapes[0];
        
        // Safety check: Only align recently created shapes (within last 30 seconds)
        const textAge = Date.now() - textShape.createdAt;
        const shapeAge = Date.now() - targetShape.createdAt;
        
        console.log(`[align_text] Text age: ${textAge}ms, Shape age: ${shapeAge}ms`);
        
        if (textAge > 30000) {
          console.warn(`[align_text] WARNING: Text is old (${Math.round(textAge/1000)}s), might be existing canvas element!`);
          return `Warning: The text "${textShape.text}" was created ${Math.round(textAge/1000)} seconds ago. Use align_text_to_shape only for newly created elements. To move existing text, use move_shape or move_shape_relative instead.`;
        }
        
        console.log(`[align_text] Aligning text "${textShape.text}" (ID: ${textShape.id.substring(0, 8)}) to ${targetShape.type}`);
        
        if (textShape.type !== 'text') {
          return `The first item matching "${textDescription}" is not text`;
        }
        
        let newX = targetShape.x;
        let newY = targetShape.y;
        
        const shapeWidth = targetShape.width || (targetShape.radius ? targetShape.radius * 2 : 100);
        const shapeHeight = targetShape.height || (targetShape.radius ? targetShape.radius * 2 : 100);
        
        // Calculate aligned position
        switch (alignment) {
          case 'center':
            newX = targetShape.x;
            newY = targetShape.y;
            break;
          case 'top':
            newX = targetShape.x;
            newY = targetShape.y - shapeHeight / 2 + (textShape.fontSize || 24) / 2 + 20;
            break;
          case 'bottom':
            newX = targetShape.x;
            newY = targetShape.y + shapeHeight / 2 - (textShape.fontSize || 24) / 2 - 20;
            break;
          case 'left-center':
            // Left-aligned with padding, vertically centered (perfect for form labels)
            newX = targetShape.x - shapeWidth / 2 + (textShape.fontSize || 24) * 2;
            newY = targetShape.y;
            break;
          case 'left':
            newX = targetShape.x - shapeWidth / 2 + 30;
            newY = targetShape.y;
            break;
          case 'right':
            newX = targetShape.x + shapeWidth / 2 - 30;
            newY = targetShape.y;
            break;
        }
        
        const updatedText: Shape = {
          ...textShape,
          x: newX,
          y: newY,
          updatedAt: Date.now(),
        };
        
        this.context.updateShape(updatedText);
        return `Aligned text "${textShape.text}" to ${alignment} of ${targetShape.type} at position (${Math.round(newX)}, ${Math.round(newY)})`;
      },
    });

    // Tool 18: Create basic layout
    const createBasicLayoutTool = new DynamicStructuredTool({
      name: 'create_basic_layout',
      description: 'Creates a basic webpage layout with header, left navigation, body content area, and footer. Perfect for wireframing or creating UI mockups.',
      schema: z.object({
        x: z.number().optional().describe('Optional center x coordinate for the layout (defaults to canvas center)'),
        y: z.number().optional().describe('Optional center y coordinate for the layout (defaults to canvas center)'),
        width: z.number().default(800).describe('Total width of the layout in pixels'),
        height: z.number().default(600).describe('Total height of the layout in pixels'),
        headerColor: z.string().default('black').describe('Color for the header section'),
        navColor: z.string().default('dark gray').describe('Color for the left navigation section'),
        bodyColor: z.string().default('gray').describe('Color for the main body/content area'),
        footerColor: z.string().default('black').describe('Color for the footer section'),
        addLabels: z.boolean().default(true).describe('Whether to add text labels to each section'),
      }),
      func: async ({ x, y, width, height, headerColor, navColor, bodyColor, footerColor, addLabels }) => {
        // Default to center of canvas if not specified
        const centerX = x ?? this.context.canvasWidth / 2;
        const centerY = y ?? this.context.canvasHeight / 2;
        
        // Calculate positions (top-left origin for easier calculation)
        const layoutLeft = centerX - width / 2;
        const layoutTop = centerY - height / 2;
        
        // Define section dimensions
        const headerHeight = height * 0.12; // 12% for header
        const footerHeight = height * 0.08; // 8% for footer
        const navWidth = width * 0.2; // 20% for left nav
        const bodyHeight = height - headerHeight - footerHeight; // Remaining height
        const bodyWidth = width - navWidth; // Remaining width
        
        const shapes: Shape[] = [];
        
        // 1. Header (full width, top)
        const header: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x: layoutLeft + width / 2,
          y: layoutTop + headerHeight / 2,
          width: width,
          height: headerHeight,
          stroke: this.parseColor(headerColor),
          strokeWidth: 2,
          fill: hexToRgba(this.parseColor(headerColor), 0.2),
          rotation: 0,
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        shapes.push(header);
        
        // 2. Left Navigation (below header, left side)
        const nav: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x: layoutLeft + navWidth / 2,
          y: layoutTop + headerHeight + bodyHeight / 2,
          width: navWidth,
          height: bodyHeight,
          stroke: this.parseColor(navColor),
          strokeWidth: 2,
          fill: hexToRgba(this.parseColor(navColor), 0.15),
          rotation: 0,
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        shapes.push(nav);
        
        // 3. Body/Content area (below header, right of nav)
        const body: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x: layoutLeft + navWidth + bodyWidth / 2,
          y: layoutTop + headerHeight + bodyHeight / 2,
          width: bodyWidth,
          height: bodyHeight,
          stroke: this.parseColor(bodyColor),
          strokeWidth: 2,
          fill: hexToRgba(this.parseColor(bodyColor), 0.05),
          rotation: 0,
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        shapes.push(body);
        
        // 4. Footer (full width, bottom)
        const footer: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x: layoutLeft + width / 2,
          y: layoutTop + height - footerHeight / 2,
          width: width,
          height: footerHeight,
          stroke: this.parseColor(footerColor),
          strokeWidth: 2,
          fill: hexToRgba(this.parseColor(footerColor), 0.2),
          rotation: 0,
          zIndex: 0,
          createdBy: this.context.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        shapes.push(footer);
        
        // Add text labels if requested
        if (addLabels) {
          const headerText: Shape = {
            id: uuidv4(),
            type: 'text',
            x: header.x,
            y: header.y,
            text: 'Header',
            fontSize: Math.min(24, headerHeight * 0.4),
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            textDecoration: 'none',
            fill: this.parseColor(headerColor),
            zIndex: 1,
            createdBy: this.context.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          shapes.push(headerText);
          
          const navText: Shape = {
            id: uuidv4(),
            type: 'text',
            x: nav.x,
            y: nav.y,
            text: 'Navigation',
            fontSize: Math.min(20, navWidth * 0.15),
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            fill: this.parseColor(navColor),
            zIndex: 1,
            createdBy: this.context.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          shapes.push(navText);
          
          const bodyText: Shape = {
            id: uuidv4(),
            type: 'text',
            x: body.x,
            y: body.y,
            text: 'Main Content',
            fontSize: Math.min(28, bodyWidth * 0.06),
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            fill: '#666666',
            zIndex: 1,
            createdBy: this.context.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          shapes.push(bodyText);
          
          const footerText: Shape = {
            id: uuidv4(),
            type: 'text',
            x: footer.x,
            y: footer.y,
            text: 'Footer',
            fontSize: Math.min(18, footerHeight * 0.4),
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            fill: this.parseColor(footerColor),
            zIndex: 1,
            createdBy: this.context.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          shapes.push(footerText);
        }
        
        // Add all shapes using batch update if available
        if (this.context.batchUpdateShapes) {
          this.context.batchUpdateShapes(shapes);
        } else {
          shapes.forEach(shape => this.context.addShape(shape));
        }
        
        return `Created a basic layout (${width}x${height}) with header (${headerColor}), left navigation (${navColor}), body (${bodyColor}), and footer (${footerColor}) at position (${Math.round(centerX)}, ${Math.round(centerY)})${addLabels ? ' with labels' : ''}`;
      },
    });

    // Tool 19: Get shape history
    const getShapeHistoryTool = new DynamicStructuredTool({
      name: 'get_shape_history',
      description: 'Gets the complete history of changes made to a shape, including who made changes and when. Shows all versions from creation to current state.',
      schema: z.object({
        description: z.string().describe('Description of the shape to get history for (e.g., "red circle", "text with Hello")'),
      }),
      func: async ({ description }) => {
        if (!this.context.getShapeHistory) {
          return 'History feature is not available';
        }
        
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const history = await this.context.getShapeHistory(shape.id);
        
        if (history.length === 0) {
          return `Shape ${shape.type} has no history entries yet.`;
        }
        
        let response = `Found ${history.length} version(s) of ${shape.type}:\n\n`;
        
        history.forEach((entry, index) => {
          const timeAgo = Math.floor((Date.now() - entry.timestamp) / 1000);
          let timeStr = '';
          
          if (timeAgo < 60) timeStr = `${timeAgo}s ago`;
          else if (timeAgo < 3600) timeStr = `${Math.floor(timeAgo / 60)}m ago`;
          else if (timeAgo < 86400) timeStr = `${Math.floor(timeAgo / 3600)}h ago`;
          else timeStr = `${Math.floor(timeAgo / 86400)}d ago`;
          
          response += `${index + 1}. ${entry.action.toUpperCase()} by ${entry.userName || 'Unknown'} (${timeStr})\n`;
          response += `   History ID: ${entry.id.substring(0, 8)}...\n`;
          response += `   Position: (${Math.round(entry.snapshot.x)}, ${Math.round(entry.snapshot.y)})`;
          
          if (entry.snapshot.width) response += `, Size: ${Math.round(entry.snapshot.width)}×${Math.round(entry.snapshot.height || 0)}`;
          if (entry.snapshot.radius) response += `, Radius: ${Math.round(entry.snapshot.radius)}`;
          if (entry.snapshot.rotation) response += `, Rotation: ${entry.snapshot.rotation}°`;
          if (entry.snapshot.text) response += `, Text: "${entry.snapshot.text}"`;
          
          response += `\n`;
        });
        
        return response;
      },
    });

    // Tool 20: Restore shape version
    const restoreShapeVersionTool = new DynamicStructuredTool({
      name: 'restore_shape_version',
      description: 'Restores a shape to a previous version from its history. Use after getting shape history to see available versions.',
      schema: z.object({
        description: z.string().describe('Description of the shape to restore'),
        historyId: z.string().describe('The history ID from get_shape_history (8-character ID like "a3b4c5d6")'),
      }),
      func: async ({ description, historyId }) => {
        if (!this.context.getShapeHistory || !this.context.restoreShapeVersion) {
          return 'History and restore features are not available';
        }
        
        const shapes = this.findShapesByDescription(description);
        if (shapes.length === 0) {
          return `No shapes found matching "${description}"`;
        }
        
        const shape = shapes[0];
        const history = await this.context.getShapeHistory(shape.id);
        
        // Find the history entry by partial ID match
        const entry = history.find(h => h.id.startsWith(historyId));
        
        if (!entry) {
          return `No history version found with ID starting with "${historyId}". Use get_shape_history first to see available versions.`;
        }
        
        await this.context.restoreShapeVersion(entry);
        
        const timeAgo = Math.floor((Date.now() - entry.timestamp) / 1000);
        let timeStr = '';
        
        if (timeAgo < 60) timeStr = `${timeAgo}s ago`;
        else if (timeAgo < 3600) timeStr = `${Math.floor(timeAgo / 60)}m ago`;
        else if (timeAgo < 86400) timeStr = `${Math.floor(timeAgo / 3600)}h ago`;
        else timeStr = `${Math.floor(timeAgo / 86400)}d ago`;
        
        return `Successfully restored ${shape.type} to version from ${timeStr} (${entry.action} by ${entry.userName || 'Unknown'})`;
      },
    });

    return [
      createCircleTool,
      createRectangleTool,
      createTextTool,
      createLineTool,
      moveShapeTool,
      moveShapeRelativeTool,
      moveMultipleShapesTool,
      resizeShapeTool,
      rotateShapeTool,
      arrangeHorizontalTool,
      createGridTool,
      createMultipleCirclesTool,
      deleteShapeTool,
      getCanvasInfoTool,
      findBlankSpaceTool,
      bringToFrontTool,
      sendToBackTool,
      bringForwardTool,
      sendBackwardTool,
      alignTextToShapeTool,
      createBasicLayoutTool,
      getShapeHistoryTool,
      restoreShapeVersionTool,
    ];
  }

  async execute(userMessage: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []): Promise<string> {
    const tools = this.createTools();

    // Build conversation history for context
    const historyMessages: any[] = [];
    
    // Add recent conversation history (last 5 exchanges to avoid token bloat)
    const recentHistory = conversationHistory.slice(-10); // Last 5 user + 5 assistant messages
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        historyMessages.push(['human', msg.content]);
      } else {
        historyMessages.push(['assistant', msg.content]);
      }
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a helpful AI assistant that helps users create and manipulate shapes on a collaborative canvas. 
You have access to tools to create circles, rectangles, text, and lines, as well as move, resize, rotate, and arrange shapes.

Canvas dimensions: ${this.context.canvasWidth}x${this.context.canvasHeight}
Center position: (${this.context.canvasWidth / 2}, ${this.context.canvasHeight / 2})
Current shapes on canvas: ${this.context.shapes.length}

CRITICAL - Coordinate System Understanding:
- ALL shape coordinates (x, y) represent the CENTER of the shape, NOT the top-left corner
- Rectangles: (x, y) = center point. To place top-left at (100, 200) with 200x100 size, use x=200, y=250
- Circles: (x, y) = center point
- Text: (x, y) = center point (after recent update)
- Lines: (x, y) = starting point

When interpreting position commands:
- If user says "top-left corner at X, Y" for a WxH rectangle: center_x = X + W/2, center_y = Y + H/2
- If user says "position at X, Y" without specifying corner: use X, Y as center
- IMPORTANT: Use the EXACT coordinates the user specifies, including negative values
- Negative coordinates are VALID - do not adjust them to positive values
- Do not constrain to canvas bounds unless user asks for visible placement
- User can place shapes anywhere in the infinite canvas space
- "center" means approximately (${this.context.canvasWidth / 2}, ${this.context.canvasHeight / 2})
- Default sizes: circles radius 50, rectangles 100x100
- When creating multiple items, calculate proper spacing based on dimensions

CRITICAL - Batch operations (MUST USE for efficiency):
- When creating 5+ circles: ALWAYS use create_multiple_circles (NOT individual create_circle)
  ❌ WRONG: Call create_circle 50 times
  ✅ CORRECT: Call create_multiple_circles once with count=50
- When moving 2+ shapes: ALWAYS use move_multiple_shapes (NOT individual move_shape)
  ❌ WRONG: Call move_shape 25 times
  ✅ CORRECT: Call move_multiple_shapes once with count=25
- Examples:
  "create 50 blue circles" → create_multiple_circles(count=50, color="blue", pattern="grid")
  "move 25 of them left by 100" → move_multiple_shapes(description="blue circles", count=25, dx=-100)
  "move 25 to the right by 100" → move_multiple_shapes(description="blue circles", count=25, dx=100)
- This saves iterations and prevents "max iterations" errors

IMPORTANT for movements:
- For RELATIVE movements like "move X pixels left/right/up/down", ALWAYS use move_shape_relative with dx/dy offsets
  Example: "move 100 left" = dx=-100, dy=0
  Example: "move 200 pixels left" = dx=-200, dy=0
  Example: "move 50 right and 30 down" = dx=50, dy=30
- For ABSOLUTE positions like "move to 300, 200" or "move to center", use move_shape with exact x, y coordinates
- For moving GROUPS: use move_multiple_shapes with count parameter

Spatial awareness:
- You can use get_canvas_info with includePositions=true to see where all shapes are located
- You can use find_blank_space to find empty areas on the canvas before placing new shapes
- This helps avoid overlapping shapes and creates better layouts

Layer controls:
- You can control the stacking order of shapes using bring_to_front, send_to_back, bring_forward, and send_backward
- Lower zIndex = behind, higher zIndex = in front
- Use these when shapes overlap and you need to control which appears on top
- Examples: "bring the red circle to the front", "send the rectangle to the back"

Text alignment:
- You can align text to other shapes using align_text_to_shape
- Supports: center, top, bottom, left, right, left-center alignment
- For form field labels (Username, Password, etc.): use 'left-center' alignment
  - This left-aligns text with padding and centers it vertically
  - Creates proper form input appearance
- For titles/buttons: use 'center' alignment
- Examples: 
  - "align Username text to left-center of input box"
  - "center the Login text in the button rectangle"

Form creation best practices:
- ALWAYS create NEW text elements - never move or reuse existing text on the canvas
- When creating a form, ALWAYS create BOTH rectangles AND text for each field
- Form structure for each input field:
  1. Create a rectangle (input box) with black border and white/transparent fill
  2. Create new text label (Username, Password, etc.)
  3. Align text to left-center of the rectangle
- For buttons:
  1. Create a rectangle with black border
  2. Create new button text (Login, Submit, etc.)
  3. Align text to center of the rectangle
- Use dark gray (#808080 or gray) for field labels (Username, Password)
- Use black for titles and button text
- Use left-center alignment for field labels inside input boxes
- Use center alignment for button text
- Standard input field size: 200-250px wide, 40-50px tall
- Add proper spacing between elements (50-70px vertical spacing)
- Complete workflow: Create rectangle → Create new text → Align text to rectangle

Example: Creating a login form with top-left at (600, -600):
- Form dimensions: 300w x 400h
- Container center: x = 600 + 300/2 = 750, y = -600 + 400/2 = -400
Steps:
1. Create container rectangle at (750, -400) - 300x400
2. Create title text "Login" - black
3. Align title text to 'top' of container rectangle (automatic 20px padding)
4. Create username input rectangle at (750, -470) - 220x45 - black border
5. Create username text "Username" - dark gray  
6. Align username text to left-center of username rectangle
7. Create password input rectangle at (750, -410) - 220x45 - black border
8. Create password text "Password" - dark gray
9. Align password text to left-center of password rectangle
10. Create button rectangle at (750, -340) - 120x40 - black border
11. Create button text "Login" - black
12. Align button text to center of button rectangle
Result: Complete login form with top-left at (600, -600), including negative Y coordinates

CRITICAL - Do NOT touch existing canvas elements:
- When creating NEW forms/layouts, ONLY manipulate shapes you just created
- Do NOT move, align, or modify shapes that were on the canvas before your command
- align_text_to_shape should ONLY be used for text created in the current command
- If user asks to move existing elements, they will use move_shape commands explicitly
- Focus on creating new elements, not reorganizing existing ones

IMPORTANT execution guidelines:
- After completing all requested operations, provide a final response and STOP
- Don't verify or check your work - trust the tools executed successfully
- Once shapes are created and positioned, you're done
- Maximum 15 iterations available - use them wisely
- REMEMBER: Every input field needs BOTH a rectangle box AND text label
- Create ALL elements fresh - never reuse existing canvas shapes

Conversation context:
- You have access to the conversation history above
- Use context to understand references like "them", "those shapes", "the circles I just created"
- Build on previous commands naturally
- Example: User says "create 50 circles" then "move half of them left" - you should remember the 50 circles

Be creative and helpful in interpreting user intent!`],
      ...historyMessages,
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = await createOpenAIToolsAgent({
      llm: this.model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 15,
      returnIntermediateSteps: true,
    });

    try {
      console.log('Invoking agent with input:', userMessage);
      const result = await agentExecutor.invoke({
        input: userMessage,
      });

      console.log('Agent result:', result);
      console.log('Agent output:', result.output);
      console.log('Agent output type:', typeof result.output);
      console.log('Intermediate steps:', result.intermediateSteps);
      
      // If we have intermediate steps but no output, something went wrong
      if (result.intermediateSteps && result.intermediateSteps.length > 0) {
        console.log('Tools were called:');
        result.intermediateSteps.forEach((step: any, i: number) => {
          console.log(`  Step ${i + 1}:`, step);
        });
      }
      
      // If output is empty or undefined, provide a default message
      if (!result.output || result.output.trim() === '') {
        // Check if tools were executed successfully
        if (result.intermediateSteps && result.intermediateSteps.length > 0) {
          const lastStep = result.intermediateSteps[result.intermediateSteps.length - 1];
          const observation = lastStep.observation || 'executed successfully';
          return `Command completed: ${observation}`;
        }
        return 'Command processed. The AI completed the task but did not provide a response message.';
      }
      
      return result.output;
    } catch (error) {
      console.error('Agent execution error:', error);
      return `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

