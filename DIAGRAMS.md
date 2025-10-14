# CollabCanvas - System Diagrams

This document contains mermaid diagrams visualizing the CollabCanvas system architecture, flows, and timelines based on the PRD.

## Table of Contents
1. [Project Timeline](#project-timeline)
2. [System Architecture](#system-architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Authentication Flow](#authentication-flow)
5. [Real-Time Sync Flow](#real-time-sync-flow)
6. [Component Architecture](#component-architecture)
7. [Database Schema](#database-schema)

---

## Project Timeline

```mermaid
gantt
    title CollabCanvas Development Timeline
    dateFormat YYYY-MM-DD
    section Phase 1 (MVP)
    Authentication & User Mgmt    :p1a, 2024-01-01, 6h
    Canvas Foundation             :p1b, 2024-01-01, 6h
    Basic Shape System            :p1c, after p1b, 4h
    Real-Time Sync                :p1d, after p1a, 6h
    Multiplayer Cursors           :p1e, after p1d, 3h
    Presence Awareness            :p1f, after p1e, 2h
    State Persistence             :p1g, after p1d, 2h
    Deployment & Testing          :p1h, after p1g, 3h
    
    section Phase 2 (Days 2-4)
    Expanded Canvas Features      :p2a, after p1h, 2d
    Advanced Collaboration        :p2b, after p2a, 1d
    Performance Optimization      :p2c, after p2b, 1d
    
    section Phase 3 (Days 4-6)
    AI Integration Setup          :p3a, after p2c, 1d
    Canvas API Functions          :p3b, after p3a, 6h
    AI Commands Implementation    :p3c, after p3b, 1d
    AI Testing                    :p3d, after p3c, 6h
    
    section Phase 4 (Days 6-7)
    UX Polish                     :p4a, after p3d, 6h
    Testing & Bug Fixes           :p4b, after p4a, 6h
    Documentation                 :p4c, after p4b, 6h
    Demo Video                    :p4d, after p4c, 6h
```

---

## System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React UI Components]
        Canvas[Konva Canvas Layer]
        Auth[Auth Component]
        Hooks[Custom Hooks]
        
        UI --> Canvas
        UI --> Auth
        UI --> Hooks
    end
    
    subgraph "Firebase Backend"
        FAuth[Firebase Authentication]
        Firestore[Firestore Database]
        RTDB[Realtime Database]
        Hosting[Firebase Hosting]
        
        FAuth -.-> Firestore
        Firestore -.-> RTDB
    end
    
    subgraph "Phase 3: AI Layer"
        AIService[AI Service]
        OpenAI[OpenAI GPT-4 / Claude]
        
        AIService --> OpenAI
    end
    
    Auth -->|Login/Register| FAuth
    Hooks -->|Shapes CRUD| Firestore
    Hooks -->|Cursors/Presence| RTDB
    UI -->|AI Commands| AIService
    AIService -->|Canvas Operations| Hooks
    
    Hosting -->|Serves| UI
    
    style UI fill:#4F46E5,color:#fff
    style Canvas fill:#4F46E5,color:#fff
    style Firestore fill:#FFA000,color:#fff
    style RTDB fill:#FFA000,color:#fff
    style FAuth fill:#FFA000,color:#fff
    style AIService fill:#10B981,color:#fff
```

---

## Data Flow Diagram

```mermaid
flowchart LR
    subgraph "User A Browser"
        A1[User Action]
        A2[Update Local State]
        A3[Broadcast Change]
    end
    
    subgraph "Firebase"
        FB1[Firestore/RTDB]
        FB2[Trigger Listeners]
    end
    
    subgraph "User B Browser"
        B1[Receive Update]
        B2[Merge State]
        B3[Re-render Canvas]
    end
    
    A1 --> A2
    A2 --> A3
    A3 -->|Write| FB1
    FB1 --> FB2
    FB2 -->|Notify| B1
    B1 --> B2
    B2 --> B3
    
    style A1 fill:#4F46E5,color:#fff
    style B3 fill:#10B981,color:#fff
    style FB1 fill:#FFA000,color:#fff
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant App
    participant AuthUI
    participant Firebase Auth
    participant Firestore
    
    User->>App: Open Application
    App->>AuthUI: Show Login/Register
    User->>AuthUI: Enter Credentials
    AuthUI->>Firebase Auth: createUser() or signIn()
    Firebase Auth-->>AuthUI: Return User Object
    
    alt Registration
        AuthUI->>Firestore: Create User Profile
        Firestore-->>AuthUI: Profile Created
    end
    
    AuthUI->>App: User Authenticated
    App->>App: Load Canvas View
    App->>Firestore: Subscribe to Shapes
    App->>RTDB: Set Presence Online
    
    Note over User,RTDB: User now in Canvas View
```

---

## Real-Time Sync Flow

```mermaid
sequenceDiagram
    participant U1 as User 1 Browser
    participant FS as Firestore
    participant RT as Realtime DB
    participant U2 as User 2 Browser
    
    Note over U1,U2: Shape Synchronization
    U1->>U1: Create Rectangle
    U1->>FS: Write Shape Data
    FS-->>U2: Trigger onSnapshot
    U2->>U2: Render New Shape
    
    Note over U1,U2: Cursor Synchronization
    U1->>U1: Move Mouse
    U1->>RT: Update Cursor Position (50ms throttle)
    RT-->>U2: Push Update (<30ms)
    U2->>U2: Render Remote Cursor
    
    Note over U1,U2: Presence Synchronization
    U1->>RT: Set Online Status
    RT-->>U2: Notify User Online
    U2->>U2: Update Users List
```

---

## Component Architecture

```mermaid
graph TD
    App[App.tsx<br/>Root Component]
    
    subgraph "UI Components"
        Auth[Auth.tsx<br/>Login/Register]
        Toolbar[Toolbar.tsx<br/>Shape Tools]
        Canvas[Canvas.tsx<br/>Konva Canvas]
        UsersList[UsersList.tsx<br/>Online Users]
    end
    
    subgraph "Custom Hooks"
        useAuth[useAuth<br/>Auth State]
        useShapes[useShapes<br/>Shape Sync]
        useCursors[useCursors<br/>Cursor Sync]
        usePresence[usePresence<br/>User Presence]
    end
    
    subgraph "Services"
        Firebase[Firebase SDK]
        Types[TypeScript Types]
        Utils[Utility Functions]
    end
    
    App --> Auth
    App --> Toolbar
    App --> Canvas
    App --> UsersList
    
    App --> useAuth
    App --> useShapes
    App --> useCursors
    App --> usePresence
    
    useAuth --> Firebase
    useShapes --> Firebase
    useCursors --> Firebase
    usePresence --> Firebase
    
    Canvas --> Types
    Toolbar --> Types
    useShapes --> Types
    
    style App fill:#4F46E5,color:#fff
    style Firebase fill:#FFA000,color:#fff
```

---

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ SHAPES : creates
    USERS {
        string id PK
        string name
        string email
        string color
        boolean online
        timestamp lastSeen
        timestamp createdAt
    }
    
    SHAPES {
        string id PK
        string type
        number x
        number y
        number width
        number height
        number radius
        string text
        number fontSize
        string fill
        number rotation
        string createdBy FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    CURSORS {
        string userId PK
        string userName
        number x
        number y
        string color
        timestamp timestamp
    }
    
    PRESENCE {
        string userId PK
        boolean online
        timestamp lastSeen
    }
    
    USERS ||--o{ CURSORS : has
    USERS ||--o{ PRESENCE : has
```

---

## MVP Features Mindmap

```mermaid
mindmap
  root((CollabCanvas<br/>MVP))
    Authentication
      Registration
      Login
      Session Mgmt
      User Profiles
    Canvas
      Pan
      Zoom
      5000x5000 Space
      Viewport Mgmt
    Shapes
      Rectangles
      Circles
      Text
      CRUD Operations
    Real-Time Sync
      Firestore
      Realtime DB
      Delta Updates
      <100ms Latency
    Multiplayer
      Cursors
      <50ms Sync
      Name Labels
      Color Coded
    Presence
      Online Users
      Join/Leave
      Tab Visibility
    Persistence
      Auto-Save
      Load State
      Reconnection
    Deployment
      Firebase Hosting
      Vercel
      Production Ready
```

---

## Phase 2 & 3 Roadmap

```mermaid
graph LR
    MVP[Phase 1: MVP<br/>✅ Complete]
    
    subgraph "Phase 2: Enhanced Canvas"
        P2A[More Shapes]
        P2B[Transformations]
        P2C[Multi-Select]
        P2D[Layers]
        P2E[Undo/Redo]
    end
    
    subgraph "Phase 3: AI Integration"
        P3A[AI Setup]
        P3B[Creation Commands]
        P3C[Manipulation]
        P3D[Layout]
        P3E[Complex Ops]
    end
    
    subgraph "Phase 4: Polish"
        P4A[UX Polish]
        P4B[Testing]
        P4C[Docs]
        P4D[Demo]
    end
    
    MVP --> P2A
    P2A --> P2B
    P2B --> P2C
    P2C --> P2D
    P2D --> P2E
    P2E --> P3A
    P3A --> P3B
    P3B --> P3C
    P3C --> P3D
    P3D --> P3E
    P3E --> P4A
    P4A --> P4B
    P4B --> P4C
    P4C --> P4D
    
    style MVP fill:#10B981,color:#fff
    style P4D fill:#4F46E5,color:#fff
```

---

## User Journey Flow

```mermaid
flowchart TD
    Start([User Visits App])
    Auth{Authenticated?}
    Login[Login/Register]
    Canvas[Canvas View]
    
    CreateShape[Create Shape]
    MoveShape[Move Shape]
    DeleteShape[Delete Shape]
    
    SeeOthers[See Other Users]
    SeeCursors[See Remote Cursors]
    SeeChanges[See Real-Time Changes]
    
    Start --> Auth
    Auth -->|No| Login
    Auth -->|Yes| Canvas
    Login -->|Success| Canvas
    
    Canvas --> CreateShape
    Canvas --> MoveShape
    Canvas --> DeleteShape
    Canvas --> SeeOthers
    
    CreateShape --> SeeChanges
    MoveShape --> SeeChanges
    DeleteShape --> SeeChanges
    
    SeeOthers --> SeeCursors
    SeeCursors --> SeeChanges
    
    style Start fill:#10B981,color:#fff
    style Canvas fill:#4F46E5,color:#fff
    style SeeChanges fill:#FFA000,color:#fff
```

---

## Performance Requirements

```mermaid
graph LR
    subgraph "Performance Targets"
        FPS[60 FPS<br/>Rendering]
        OSync[<100ms<br/>Object Sync]
        CSync[<50ms<br/>Cursor Sync]
        OCap[500+<br/>Objects]
        UCap[5+<br/>Users]
        AIResp[<2s<br/>AI Response]
    end
    
    subgraph "Testing Methods"
        T1[Pan/Zoom Test]
        T2[Multi-User Test]
        T3[Cursor Tracking]
        T4[Load Test]
        T5[Concurrent Users]
        T6[AI Commands]
    end
    
    FPS -.-> T1
    OSync -.-> T2
    CSync -.-> T3
    OCap -.-> T4
    UCap -.-> T5
    AIResp -.-> T6
    
    style FPS fill:#10B981,color:#fff
    style OSync fill:#10B981,color:#fff
    style CSync fill:#10B981,color:#fff
```

---

## AI Integration Architecture (Phase 3)

```mermaid
graph TB
    subgraph "User Interface"
        AIInput[AI Command Input]
        Canvas[Canvas Display]
    end
    
    subgraph "AI Service Layer"
        Parser[Command Parser]
        AIProvider[OpenAI/Claude API]
        FunctionCaller[Function Caller]
    end
    
    subgraph "Canvas API"
        CreateShape[createShape]
        MoveShape[moveShape]
        ResizeShape[resizeShape]
        RotateShape[rotateShape]
        DeleteShape[deleteShape]
        GetState[getCanvasState]
    end
    
    subgraph "Sync Layer"
        Firestore[(Firestore)]
    end
    
    AIInput -->|User Command| Parser
    Parser -->|Structured Query| AIProvider
    AIProvider -->|Function Calls| FunctionCaller
    
    FunctionCaller --> CreateShape
    FunctionCaller --> MoveShape
    FunctionCaller --> ResizeShape
    FunctionCaller --> RotateShape
    FunctionCaller --> DeleteShape
    FunctionCaller --> GetState
    
    CreateShape --> Firestore
    MoveShape --> Firestore
    ResizeShape --> Firestore
    RotateShape --> Firestore
    DeleteShape --> Firestore
    
    Firestore -->|Real-Time Sync| Canvas
    
    style AIProvider fill:#10B981,color:#fff
    style Firestore fill:#FFA000,color:#fff
    style Canvas fill:#4F46E5,color:#fff
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Code[Source Code]
        Build[Vite Build]
        Dist[dist/ folder]
    end
    
    subgraph "Firebase Platform"
        Hosting[Firebase Hosting<br/>CDN]
        Auth[Firebase Auth]
        FS[Firestore]
        RT[Realtime DB]
    end
    
    subgraph "Alternative: Vercel"
        VHosting[Vercel Hosting<br/>Edge Network]
    end
    
    subgraph "Users"
        Browser1[Browser 1]
        Browser2[Browser 2]
        BrowserN[Browser N]
    end
    
    Code --> Build
    Build --> Dist
    Dist -->|firebase deploy| Hosting
    Dist -->|vercel deploy| VHosting
    
    Hosting --> Browser1
    Hosting --> Browser2
    Hosting --> BrowserN
    
    Browser1 <-->|Auth| Auth
    Browser1 <-->|Shapes| FS
    Browser1 <-->|Cursors| RT
    
    Browser2 <-->|Auth| Auth
    Browser2 <-->|Shapes| FS
    Browser2 <-->|Cursors| RT
    
    BrowserN <-->|Auth| Auth
    BrowserN <-->|Shapes| FS
    BrowserN <-->|Cursors| RT
    
    style Hosting fill:#FFA000,color:#fff
    style VHosting fill:#4F46E5,color:#fff
```

---

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> Authenticating: Login/Register
    Authenticating --> Authenticated: Success
    Authenticating --> Unauthenticated: Failure
    
    Authenticated --> LoadingCanvas: Load App
    LoadingCanvas --> CanvasReady: Shapes Loaded
    
    CanvasReady --> ShapeSelected: Click Shape
    CanvasReady --> CreatingShape: Add Shape
    CanvasReady --> Panning: Drag Background
    CanvasReady --> Zooming: Mouse Wheel
    
    ShapeSelected --> MovingShape: Drag Shape
    ShapeSelected --> CanvasReady: Deselect
    ShapeSelected --> Deleting: Delete Key
    
    MovingShape --> ShapeSelected: Release
    CreatingShape --> ShapeSelected: Created
    Deleting --> CanvasReady: Deleted
    
    Panning --> CanvasReady: Release
    Zooming --> CanvasReady: Stop Scroll
    
    CanvasReady --> [*]: Logout
```

---

## MVP Success Criteria Checklist

```mermaid
graph TD
    Start{MVP Complete?}
    
    C1[✅ Deployed &<br/>Accessible]
    C2[✅ Authentication<br/>Working]
    C3[✅ Pan & Zoom<br/>Functional]
    C4[✅ Shapes Created<br/>& Moved]
    C5[✅ Real-Time<br/>Sync <100ms]
    C6[✅ Multiplayer<br/>Cursors <50ms]
    C7[✅ Online Users<br/>List]
    C8[✅ State<br/>Persists]
    
    Success[🎉 MVP COMPLETE!]
    Fail[❌ More Work Needed]
    
    Start --> C1
    Start --> C2
    Start --> C3
    Start --> C4
    Start --> C5
    Start --> C6
    Start --> C7
    Start --> C8
    
    C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 --> Success
    C1 -.->|Any Missing| Fail
    
    style Success fill:#10B981,color:#fff
    style Fail fill:#EF4444,color:#fff
```

---

## How to View These Diagrams

These mermaid diagrams can be viewed in:

1. **GitHub** - Automatically renders mermaid in markdown
2. **VS Code** - Use "Markdown Preview Enhanced" extension
3. **Online** - Copy to [mermaid.live](https://mermaid.live) editor
4. **Documentation sites** - Most markdown renderers support mermaid

## Diagram Legend

- **Blue** (#4F46E5) - Frontend/UI components
- **Orange** (#FFA000) - Firebase/Backend services  
- **Green** (#10B981) - AI/Success states
- **Red** (#EF4444) - Error/Failure states

---

Generated from CollabCanvas PRD - See [collabcanvas_prd.md](./collabcanvas_prd.md) for detailed requirements.

