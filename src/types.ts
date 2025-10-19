export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'arrow';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  rotation?: number;
  points?: number[]; // For lines
  zIndex?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  color: string;
  online: boolean;
  lastSeen: number;
  groupId: string;
  groupName?: string; // Original display name of the group
}

export interface GroupInfo {
  id: string; // Normalized group name (lowercase, no spaces)
  name: string; // Display name
  createdAt: number;
  memberCount?: number;
}

export interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface HistoryState {
  shapes: Shape[];
  timestamp: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastDisconnect?: number;
}

export interface ShapeHistoryEntry {
  id: string; // Unique ID for the history entry
  shapeId: string; // ID of the shape this history entry belongs to
  snapshot: Shape; // Complete snapshot of the shape at this point in time
  timestamp: number; // When this version was created
  userId: string; // Who made this change
  userName?: string; // User's display name
  action: 'created' | 'updated' | 'transformed' | 'styled'; // Type of change
  description?: string; // Optional description of the change
}

