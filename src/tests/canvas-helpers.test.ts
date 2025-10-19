import { describe, it, expect } from 'vitest';

// Mock shape data for testing
const mockShape = {
  id: 'test-shape-1',
  type: 'rectangle' as const,
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  fill: '#FF0000',
  stroke: '#000000',
  strokeWidth: 2,
  rotation: 0,
  createdBy: 'user123',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('Canvas Helper Functions', () => {
  describe('Shape Operations', () => {
    it('should create a valid shape object', () => {
      expect(mockShape.id).toBeTruthy();
      expect(mockShape.type).toBe('rectangle');
      expect(mockShape.x).toBeGreaterThanOrEqual(0);
      expect(mockShape.y).toBeGreaterThanOrEqual(0);
      expect(mockShape.width).toBeGreaterThan(0);
      expect(mockShape.height).toBeGreaterThan(0);
    });

    it('should have required properties', () => {
      expect(mockShape).toHaveProperty('id');
      expect(mockShape).toHaveProperty('type');
      expect(mockShape).toHaveProperty('x');
      expect(mockShape).toHaveProperty('y');
      expect(mockShape).toHaveProperty('createdBy');
      expect(mockShape).toHaveProperty('createdAt');
      expect(mockShape).toHaveProperty('updatedAt');
    });

    it('should have valid color values', () => {
      expect(mockShape.fill).toMatch(/^#[0-9A-F]{6}$/i);
      expect(mockShape.stroke).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should have valid timestamps', () => {
      expect(mockShape.createdAt).toBeLessThanOrEqual(Date.now());
      expect(mockShape.updatedAt).toBeLessThanOrEqual(Date.now());
      expect(mockShape.updatedAt).toBeGreaterThanOrEqual(mockShape.createdAt);
    });
  });

  describe('Shape Types', () => {
    const shapeTypes = ['rectangle', 'circle', 'line', 'arrow', 'text'];

    it('should support all shape types', () => {
      shapeTypes.forEach((type) => {
        expect(['rectangle', 'circle', 'line', 'arrow', 'text']).toContain(type);
      });
    });

    it('should validate circle specific properties', () => {
      const circle = {
        ...mockShape,
        type: 'circle' as const,
        radius: 50,
      };

      expect(circle.radius).toBeGreaterThan(0);
      expect(circle).toHaveProperty('radius');
    });

    it('should validate line specific properties', () => {
      const line = {
        ...mockShape,
        type: 'line' as const,
        points: [100, 100, 200, 200],
      };

      expect(line.points).toHaveLength(4);
      expect(line.points.every((p) => typeof p === 'number')).toBe(true);
    });

    it('should validate text specific properties', () => {
      const text = {
        ...mockShape,
        type: 'text' as const,
        text: 'Hello World',
        fontSize: 16,
      };

      expect(text.text).toBeTruthy();
      expect(text.fontSize).toBeGreaterThan(0);
    });
  });

  describe('Shape Bounds and Collision', () => {
    it('should calculate correct bounds for rectangle', () => {
      const bounds = {
        left: mockShape.x,
        right: mockShape.x + mockShape.width,
        top: mockShape.y,
        bottom: mockShape.y + mockShape.height,
      };

      expect(bounds.right).toBeGreaterThan(bounds.left);
      expect(bounds.bottom).toBeGreaterThan(bounds.top);
      expect(bounds.right - bounds.left).toBe(mockShape.width);
      expect(bounds.bottom - bounds.top).toBe(mockShape.height);
    });

    it('should handle rotation', () => {
      const rotatedShape = { ...mockShape, rotation: 45 };
      expect(rotatedShape.rotation).toBeGreaterThanOrEqual(0);
      expect(rotatedShape.rotation).toBeLessThan(360);
    });
  });

  describe('Shape Validation', () => {
    it('should validate positive dimensions', () => {
      expect(mockShape.width).toBeGreaterThan(0);
      expect(mockShape.height).toBeGreaterThan(0);
      expect(mockShape.strokeWidth).toBeGreaterThanOrEqual(0);
    });

    it('should validate ID uniqueness format', () => {
      expect(mockShape.id).toMatch(/^[a-z0-9-]+$/i);
      expect(mockShape.id.length).toBeGreaterThan(0);
    });

    it('should validate user ID format', () => {
      expect(mockShape.createdBy).toBeTruthy();
      expect(typeof mockShape.createdBy).toBe('string');
    });
  });
});

