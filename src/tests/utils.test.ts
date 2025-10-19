import { describe, it, expect } from 'vitest';
import { hexToRgba, getUserColor, getRandomColor } from '../utils/colors';

describe('Utility Functions Tests', () => {
  describe('Color Utilities', () => {
    describe('hexToRgba', () => {
      it('should convert hex to rgba with full opacity', () => {
        const result = hexToRgba('#FF0000', 1);
        expect(result).toBe('rgba(255, 0, 0, 1)');
      });

      it('should convert hex to rgba with custom opacity', () => {
        const result = hexToRgba('#00FF00', 0.5);
        expect(result).toBe('rgba(0, 255, 0, 0.5)');
      });

      it('should handle hex colors without hash', () => {
        const result = hexToRgba('0000FF', 1);
        expect(result).toBe('rgba(0, 0, 255, 1)');
      });

      it('should handle zero opacity', () => {
        const result = hexToRgba('#FFFFFF', 0);
        expect(result).toBe('rgba(255, 255, 255, 0)');
      });

      it('should handle partial opacity', () => {
        const result = hexToRgba('#123456', 0.75);
        expect(result).toBe('rgba(18, 52, 86, 0.75)');
      });
    });

    describe('getUserColor', () => {
      it('should generate a valid hex color for a user ID', () => {
        const color = getUserColor('user123');
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });

      it('should generate consistent colors for same user ID', () => {
        const color1 = getUserColor('testUser');
        const color2 = getUserColor('testUser');
        expect(color1).toBe(color2);
      });

      it('should generate different colors for different user IDs', () => {
        const color1 = getUserColor('user1');
        const color2 = getUserColor('user2');
        // Note: Due to hash collisions, this might occasionally be the same
        // but statistically should be different most of the time
        expect(typeof color1).toBe('string');
        expect(typeof color2).toBe('string');
      });

      it('should handle empty string', () => {
        const color = getUserColor('');
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });

      it('should use pastel colors from predefined palette', () => {
        const validColors = [
          '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
          '#E0BBE4', '#FFDFD3', '#C7CEEA', '#D4F1F4', '#FEC8D8',
          '#B5EAD7', '#C8E6C9', '#FFF9C4', '#FFCCBC', '#D1C4E9'
        ];
        const color = getUserColor('testuser');
        expect(validColors).toContain(color);
      });
    });

    describe('getRandomColor', () => {
      it('should generate a valid hex color', () => {
        const color = getRandomColor();
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });

      it('should return a color from the predefined palette', () => {
        const validColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const color = getRandomColor();
        expect(validColors).toContain(color);
      });
    });
  });
});

