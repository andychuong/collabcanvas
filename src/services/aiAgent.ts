import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Shape, ShapeType } from '../types';
import { hexToRgba } from '../utils/colors';

interface AIAgentContext {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  deleteShape: (shapeId: string) => void;
  userId: string;
  canvasWidth: number;
  canvasHeight: number;
}

export class CanvasAIAgent {
  private model: ChatOpenAI;
  private context: AIAgentContext;

  constructor(context: AIAgentContext) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }

    this.model = new ChatOpenAI({
      apiKey: apiKey,
      modelName: 'gpt-4-turbo-preview',
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
    };

    const normalized = colorStr.toLowerCase().trim();
    return colorMap[normalized] || (colorStr.startsWith('#') ? colorStr : '#000000');
  }

  // Helper to find shapes by description
  private findShapesByDescription(description: string): Shape[] {
    const desc = description.toLowerCase();
    
    console.log(`[findShapes] Searching for: "${description}"`);
    console.log(`[findShapes] Total shapes on canvas:`, this.context.shapes.length);
    
    const matches = this.context.shapes.filter(shape => {
      let typeMatches = false;
      let colorMatches = false;
      let hasTypeInDesc = false;
      let hasColorInDesc = false;
      
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
        });
        
        for (const [name, hex] of colorNames) {
          if (desc.includes(name)) {
            hasColorInDesc = true;
            const colorMatch = shapeColor.toUpperCase().includes(hex.substring(0, 7).toUpperCase());
            console.log(`[findShapes] Shape ${shape.id.substring(0, 8)}: type=${shape.type}, color=${shapeColor}, checking ${name} (${hex}), match=${colorMatch}`);
            if (colorMatch) {
              colorMatches = true;
            }
            break;
          }
        }
      }
      
      // Match by text content
      if (shape.text && desc.includes(shape.text.toLowerCase())) {
        console.log(`[findShapes] Shape ${shape.id.substring(0, 8)}: Matched by text content`);
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

    // Tool 10: Delete shape
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

    return [
      createCircleTool,
      createRectangleTool,
      createTextTool,
      createLineTool,
      moveShapeTool,
      moveShapeRelativeTool,
      resizeShapeTool,
      rotateShapeTool,
      arrangeHorizontalTool,
      createGridTool,
      deleteShapeTool,
      getCanvasInfoTool,
      findBlankSpaceTool,
    ];
  }

  async execute(userMessage: string): Promise<string> {
    const tools = this.createTools();

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a helpful AI assistant that helps users create and manipulate shapes on a collaborative canvas. 
You have access to tools to create circles, rectangles, text, and lines, as well as move, resize, rotate, and arrange shapes.

Canvas dimensions: ${this.context.canvasWidth}x${this.context.canvasHeight}
Center position: (${this.context.canvasWidth / 2}, ${this.context.canvasHeight / 2})
Current shapes on canvas: ${this.context.shapes.length}

When interpreting commands:
- For positions, use reasonable coordinates within the canvas bounds (0-${this.context.canvasWidth} for x, 0-${this.context.canvasHeight} for y)
- "center" means approximately (${this.context.canvasWidth / 2}, ${this.context.canvasHeight / 2})
- Default sizes: circles radius 50, rectangles 100x100
- When creating multiple items (like forms or navigation bars), create each element separately with appropriate spacing
- For complex layouts, break them down into individual shape creations

IMPORTANT for movements:
- For RELATIVE movements like "move X pixels left/right/up/down", ALWAYS use move_shape_relative with dx/dy offsets
  Example: "move 100 left" = dx=-100, dy=0
  Example: "move 200 pixels left" = dx=-200, dy=0
  Example: "move 50 right and 30 down" = dx=50, dy=30
- For ABSOLUTE positions like "move to 300, 200" or "move to center", use move_shape with exact x, y coordinates

Spatial awareness:
- You can use get_canvas_info with includePositions=true to see where all shapes are located
- You can use find_blank_space to find empty areas on the canvas before placing new shapes
- This helps avoid overlapping shapes and creates better layouts

Be creative and helpful in interpreting user intent!`],
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
      maxIterations: 5,
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

