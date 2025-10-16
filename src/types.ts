export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line';

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

