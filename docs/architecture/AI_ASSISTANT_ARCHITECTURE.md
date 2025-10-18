# AI Assistant Architecture

## Overview

The AI Assistant is a client-side, agent-based system that enables natural language interaction with the collaborative canvas. It uses OpenAI's GPT-4o model orchestrated through LangChain to dynamically select and execute tools that manipulate canvas shapes.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    AIChat Component                            │  │
│  │  • Chat UI with message history                                │  │
│  │  • API Key management (localStorage)                           │  │
│  │  • Conversation context tracking                               │  │
│  │  • Example command suggestions                                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User Message + Conversation History
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI AGENT SERVICE                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   CanvasAIAgent                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │          LangChain Agent Executor                        │  │  │
│  │  │  • AgentExecutor with OpenAI Tools Agent                │  │  │
│  │  │  • Max 15 iterations                                     │  │  │
│  │  │  • Verbose logging enabled                              │  │  │
│  │  │  • Returns intermediate steps                           │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                            │                                    │  │
│  │                            │ Invokes tools based on intent     │  │
│  │                            ▼                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              GPT-4o Model (ChatOpenAI)                   │  │  │
│  │  │  • Model: gpt-4o                                        │  │  │
│  │  │  • Temperature: 0.1 (deterministic)                     │  │  │
│  │  │  • System prompt with canvas context                    │  │  │
│  │  │  • Conversation history (last 10 messages)              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                            │                                    │  │
│  │                            │ Decides which tools to call        │  │
│  │                            ▼                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                Tool Selection Layer                      │  │  │
│  │  │  Analyzes user intent and selects appropriate tools     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Executes selected tools
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          TOOL REGISTRY (19 Tools)                    │
├─────────────────────────────────────────────────────────────────────┤
│  CREATION TOOLS                    │  MOVEMENT TOOLS                 │
│  • create_circle                   │  • move_shape (absolute)        │
│  • create_rectangle                │  • move_shape_relative (dx/dy)  │
│  • create_text                     │  • move_multiple_shapes (batch) │
│  • create_line                     │                                 │
│  • create_grid                     │  TRANSFORMATION TOOLS           │
│  • create_multiple_circles (batch) │  • resize_shape                 │
│                                    │  • rotate_shape                 │
│  LAYOUT TOOLS                      │                                 │
│  • arrange_horizontal              │  LAYER TOOLS                    │
│  • align_text_to_shape             │  • bring_to_front               │
│                                    │  • send_to_back                 │
│  UTILITY TOOLS                     │  • bring_forward                │
│  • get_canvas_info                 │  • send_backward                │
│  • find_blank_space                │                                 │
│  • delete_shape                    │                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Tool execution (with Zod validation)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CANVAS INTEGRATION LAYER                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   AIAgentContext                               │  │
│  │  • shapes: Shape[]                                            │  │
│  │  • addShape: (shape: Shape) => void                           │  │
│  │  • updateShape: (shape: Shape) => void                        │  │
│  │  • batchUpdateShapes: (shapes: Shape[]) => void               │  │
│  │  • deleteShape: (shapeId: string) => void                     │  │
│  │  • userId: string                                             │  │
│  │  • canvasWidth: number                                        │  │
│  │  • canvasHeight: number                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Shape mutations
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FIREBASE REAL-TIME SYNC                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │         Firestore: groups/{groupId}/canvases/main-canvas/     │  │
│  │                          shapes/{shapeId}                      │  │
│  │  • Optimistic local updates                                   │  │
│  │  • Throttled batch writes (16ms for single, RAF for batch)    │  │
│  │  • Real-time sync to all connected clients                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Real-time updates
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ALL CONNECTED CLIENTS                             │
│  • Smooth interpolation for remote updates                          │
│  • Selection awareness (glow effects)                               │
│  • Cursor tracking with interpolation                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **AIChat Component** (Presentation Layer)

**Location**: `src/components/AIChat.tsx`

**Responsibilities**:
- Render chat interface with message history
- Manage API key (localStorage persistence)
- Handle user input and message sending
- Display loading states and errors
- Provide example commands for onboarding

**State Management**:
```typescript
messages: Message[]           // Chat history
inputValue: string            // Current input
isLoading: boolean            // Request in progress
apiKey: string                // User's OpenAI API key
showSettings: boolean         // Settings panel visibility
```

**Data Flow**:
```
User Input → Validate API Key → Create CanvasAIAgent → Execute Command → Display Response
```

---

### 2. **CanvasAIAgent** (Business Logic Layer)

**Location**: `src/services/aiAgent.ts`

**Responsibilities**:
- Initialize LangChain agent with GPT-4o
- Create and register 19 specialized tools
- Execute user commands via agent executor
- Maintain conversation context
- Parse and validate tool parameters
- Handle shape matching and selection

**Key Classes & Methods**:

```typescript
class CanvasAIAgent {
  private model: ChatOpenAI;           // GPT-4o instance
  private context: AIAgentContext;     // Canvas state & callbacks
  
  constructor(apiKey: string, context: AIAgentContext)
  
  // Tool creation
  private createTools(): DynamicStructuredTool[]
  
  // Shape matching algorithm
  private findShapesByDescription(description: string): Shape[]
  
  // Color parsing
  private parseColor(colorStr: string): string
  
  // Main execution entry point
  async execute(userMessage: string, conversationHistory: Array<{role, content}>): Promise<string>
}
```

---

### 3. **Tool System** (Action Layer)

**Architecture Pattern**: **Dynamic Structured Tools with Zod Schema Validation**

Each tool is a `DynamicStructuredTool` with:

```typescript
new DynamicStructuredTool({
  name: string,                    // Tool identifier
  description: string,             // When to use this tool (for GPT)
  schema: z.object({...}),        // Zod schema for parameters
  func: async (params) => {...}   // Execution function
})
```

**Tool Categories**:

#### **Creation Tools** (6 tools)
- Single shape creation (circles, rectangles, text, lines)
- Batch creation (grids, multiple circles)
- Optimized for different use cases

#### **Movement Tools** (3 tools)
- Absolute positioning (`move_shape`)
- Relative offset (`move_shape_relative` with dx/dy)
- Batch movement (`move_multiple_shapes` for 2-100+ shapes)

#### **Transformation Tools** (2 tools)
- Resize by scale or explicit dimensions
- Rotation for rectangles

#### **Layout Tools** (2 tools)
- Horizontal arrangement with spacing
- Text-to-shape alignment (9 alignment modes)

#### **Layer Management** (4 tools)
- Z-index manipulation for stacking order
- Fine-grained control over visual hierarchy

#### **Utility Tools** (2 tools)
- Canvas introspection (`get_canvas_info`)
- Spatial awareness (`find_blank_space`)

---

### 4. **Agent Executor** (Orchestration Layer)

**LangChain Configuration**:

```typescript
const agentExecutor = new AgentExecutor({
  agent: createOpenAIToolsAgent({
    llm: ChatOpenAI,              // GPT-4o model
    tools: DynamicStructuredTool[], // 19 tools
    prompt: ChatPromptTemplate      // System + user prompts
  }),
  tools: DynamicStructuredTool[],
  verbose: true,                   // Enable detailed logging
  maxIterations: 15,               // Prevent infinite loops
  returnIntermediateSteps: true    // Debug visibility
});
```

**Execution Flow**:
1. Receive user message + conversation history
2. GPT-4o analyzes intent
3. Selects appropriate tool(s)
4. Validates parameters via Zod schema
5. Executes tool function(s)
6. Returns natural language response

---

### 5. **Shape Matching Algorithm**

**Location**: `findShapesByDescription()` method

**Matching Strategy**:
```typescript
// 1. Text Content Matching (highest priority)
"text that says 'Login'" → Exact/partial match on shape.text

// 2. Type + Color Matching
"red circle" → shape.type === 'circle' && shape.stroke === '#FF0000'

// 3. Type-Only Matching
"rectangle" → shape.type === 'rectangle'

// 4. Color-Only Matching
"blue" → shape.stroke or shape.fill matches blue

// 5. Recency Sorting
// Prefer recently created shapes to avoid accidents
shapes.sort((a, b) => b.createdAt - a.createdAt)
```

**Safety Features**:
- Age checks (e.g., `align_text_to_shape` only works on shapes < 30 seconds old)
- Prevents accidental manipulation of existing canvas elements
- Detailed console logging for debugging

---

### 6. **System Prompt Engineering**

**Location**: Agent creation in `execute()` method

**Prompt Structure**:
```
[system] - Comprehensive instructions (1100+ lines)
  • Canvas dimensions and coordinate system
  • Tool usage guidelines
  • Batch operation requirements
  • Movement command interpretation
  • Spatial awareness capabilities
  • Form creation best practices
  • Safety rules
  • Execution limits
  
[...conversation history] - Last 10 messages
  
[human] - Current user input

[agent_scratchpad] - Tool execution results
```

**Key Training Points**:
- **Center-based coordinates**: All shapes positioned by center, not top-left
- **Batch operations**: Must use batch tools for 5+ operations
- **Relative vs absolute**: Distinguish "move 100 left" from "move to 100, 200"
- **Conversation awareness**: Use context for pronouns like "them", "those"
- **Don't touch existing**: Only manipulate newly created shapes

---

## Technology Stack

### **Frontend**
- **React** 18.2.0 - UI components
- **TypeScript** 5.x - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### **AI/ML**
- **LangChain** 0.3.x - Agent orchestration
  - `@langchain/openai` - OpenAI integration
  - `@langchain/core` - Core primitives (tools, prompts, agents)
- **OpenAI GPT-4o** - Language model
- **Zod** - Schema validation

### **Canvas**
- **Konva.js** + **React Konva** - Shape rendering

### **Backend/Sync**
- **Firebase Firestore** - Shape data persistence
- **Firebase Realtime Database** - Cursor positions

---

## Data Flow

### **Command Execution Flow**

```
1. User types command
   ↓
2. AIChat.handleSendMessage()
   ↓
3. Create CanvasAIAgent(apiKey, context)
   ↓
4. agent.execute(message, history)
   ↓
5. LangChain AgentExecutor.invoke()
   ↓
6. GPT-4o analyzes → Selects tool(s)
   ↓
7. Tool execution with validated params
   ↓
8. Canvas mutations via context callbacks
   ↓
9. Firebase writes (optimistic updates)
   ↓
10. Real-time sync to all clients
   ↓
11. Return natural language response
   ↓
12. Display in chat UI
```

### **Shape Creation Example**

```
User: "Create a red circle at 300, 200"
       ↓
GPT-4o: Selects create_circle tool
       ↓
Params: { x: 300, y: 200, radius: 50, color: "red" }
       ↓
Zod validation: ✓ Valid
       ↓
Execute: context.addShape(newShape)
       ↓
Firebase: setDoc(shapeRef, shapeData)
       ↓
All Clients: onSnapshot → Re-render with new shape
       ↓
Response: "Created a red circle at position (300, 200) with radius 50"
```

---

## Key Design Decisions

### **1. Client-Side Architecture**

**Decision**: Run entire AI agent in browser (no backend)

**Rationale**:
- Simpler deployment (no server infrastructure)
- Lower latency (direct OpenAI API calls)
- User privacy (API key never leaves browser)
- Cost efficiency (users pay for their own API usage)

**Tradeoffs**:
- Requires users to have OpenAI API key
- API key exposed in browser (localStorage)
- Can't rate limit or monitor usage centrally

---

### **2. LangChain Agent Pattern**

**Decision**: Use OpenAI Tools Agent with dynamic tool selection

**Rationale**:
- Natural language flexibility (no rigid command syntax)
- Extensible tool system (easy to add new capabilities)
- Context-aware (conversation history)
- Handles multi-step operations automatically

**Tradeoffs**:
- More expensive than simple prompt completion
- Unpredictable execution paths
- Requires iteration limits to prevent runaway costs
- Harder to debug than deterministic code

---

### **3. Tool Granularity**

**Decision**: Mix of atomic tools (create_circle) and batch tools (create_multiple_circles)

**Rationale**:
- Atomic tools: Simple, predictable, easy to reason about
- Batch tools: Prevent "max iterations" errors, improve efficiency
- Hybrid approach: Covers both simple and complex use cases

**Example**:
```
"Create 3 circles"  → OK to use create_circle 3 times (within limits)
"Create 50 circles" → Must use create_multiple_circles (batch)
```

---

### **4. Center-Based Coordinate System**

**Decision**: All shapes positioned by center point, not top-left

**Rationale**:
- Consistent with Konva.js internals
- Simplifies rotation (rotate around center)
- More intuitive for circular shapes
- Enables symmetric layouts

**Challenge**:
- AI must calculate offsets when user specifies corners
- Requires explicit training in system prompt

---

### **5. Shape Matching by Description**

**Decision**: Natural language shape selection vs shape IDs

**Rationale**:
- User-friendly ("the red circle" vs "shape-abc-123")
- Enables conversational commands ("move it left")
- Works with shapes created by others

**Challenges**:
- Ambiguity when multiple shapes match
- Requires recency sorting to prefer newly created shapes
- Need safety checks to avoid manipulating wrong shapes

---

### **6. Conversation Context Pruning**

**Decision**: Keep only last 10 messages (5 exchanges)

**Rationale**:
- Balance context vs token cost
- Most references are to recent operations
- Prevents token limit errors on long sessions

**Impact**:
- Can't reference shapes created >5 exchanges ago by description alone
- Acceptable tradeoff for cost/performance

---

## Integration Points

### **With Canvas System**

```typescript
// AIChat receives canvas state and callbacks from App.tsx
<AIChat
  isOpen={isAIChatOpen}
  onClose={() => setIsAIChatOpen(false)}
  shapes={shapes}                    // Current canvas state
  addShape={addShapeOptimistic}      // Create new shape
  updateShape={handleShapeUpdate}    // Modify existing shape
  batchUpdateShapes={throttledBatchUpdate} // Batch updates
  deleteShape={deleteShape}          // Remove shape
  userId={user.id}                   // Current user
  canvasWidth={CANVAS_WIDTH}
  canvasHeight={CANVAS_HEIGHT}
/>
```

### **With Firebase**

- Uses same `useShapes` hook as manual operations
- Shapes created by AI are indistinguishable from manual ones
- All shapes have `createdBy` field for attribution
- Real-time sync works identically

### **With Undo/Redo System**

- AI operations integrate with `useUndo` hook
- Each tool execution can be undone
- Batch operations create single undo entry

---

## Performance Considerations

### **1. Batch Operations**
- **Problem**: Creating 100 shapes = 100 iterations = slow + expensive
- **Solution**: Batch tools create all shapes in single iteration
- **Impact**: 100x faster, 1/100th the iterations

### **2. Throttled Firebase Writes**
- **Problem**: High-frequency updates (drag, batch) overwhelm Firebase
- **Solution**: Throttle writes to 16ms (60 FPS) or use RAF for batch
- **Impact**: Smooth performance, reduced Firebase costs

### **3. Parallel Tool Execution**
- **Problem**: Sequential tool calls are slow
- **Solution**: Use `Promise.all()` for independent operations
- **Impact**: Faster multi-shape creation

### **4. Optimistic Updates**
- **Problem**: Waiting for Firebase confirmation feels laggy
- **Solution**: Update local state immediately, sync to Firebase async
- **Impact**: Instant visual feedback

---

## Security & Privacy

### **API Key Management**
- **Storage**: Browser localStorage only
- **Transmission**: Direct to OpenAI (never to your servers)
- **Visibility**: Users can see their own key in DevTools (expected)

### **Firebase Security**
- AI operations subject to same Firestore rules as manual operations
- Can't create/modify shapes in groups user doesn't belong to
- `createdBy` field ensures attribution

### **Input Validation**
- Zod schema validation on all tool parameters
- Type safety via TypeScript
- Firestore schema validation on writes

---

## Error Handling

### **User-Facing Errors**
```typescript
try {
  const response = await agent.execute(userInput, history);
  // Display success message
} catch (error) {
  // Display error message in chat
  errorMessage: `Error: ${error.message}. Check console for details.`
}
```

### **Agent-Level Errors**
- **Max iterations**: Prevented by batch operations + 15 iteration limit
- **Tool errors**: Caught and returned as natural language
- **API errors**: Displayed with actionable messages

### **Logging**
- Verbose mode enabled for debugging
- Console logs for tool execution
- Intermediate steps visible in dev mode

---

## Future Extension Points

### **Potential New Tools**
- `duplicate_shape` - Clone shapes
- `group_shapes` - Create shape groups
- `create_arrow` - Directional arrows
- `create_image` - Image upload/placement
- `export_canvas` - Export to PNG/SVG

### **AI Model Upgrades**
- Switch to GPT-4o-mini for cost savings
- Add vision capabilities for "describe this layout"
- Fine-tune on canvas-specific operations

### **Enhanced Matching**
- Fuzzy text matching
- Color similarity matching
- Spatial queries ("shapes near center")

---

## Summary

The AI Assistant is a **sophisticated, agent-based system** that transforms natural language into canvas operations. It leverages:

- **GPT-4o** for intent understanding
- **LangChain** for tool orchestration  
- **19 specialized tools** for canvas manipulation
- **Real-time Firebase sync** for collaboration
- **Conversation context** for multi-turn interactions

The architecture is **fully client-side**, extensible, and integrates seamlessly with the existing collaborative canvas infrastructure. It enables users to create complex layouts and manipulations through simple conversational commands.

