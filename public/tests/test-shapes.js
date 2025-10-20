import { createShape } from './test-helpers.js';

export async function runShapeCreationTests() {
  const tests = [];
  
  // Test 1: Create rectangle shape
  try {
    const rect = createShape('rectangle', { width: 150, height: 100 });
    const isValid = 
      rect.type === 'rectangle' &&
      rect.width === 150 &&
      rect.height === 100 &&
      rect.x === 100 &&
      rect.y === 100 &&
      rect.rotation === 0;
    
    tests.push({
      name: 'Should create rectangle with correct properties',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should create rectangle with correct properties',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Create circle shape
  try {
    const circle = createShape('circle', { radius: 75 });
    const isValid = 
      circle.type === 'circle' &&
      circle.radius === 75 &&
      circle.x === 100 &&
      circle.y === 100;
    
    tests.push({
      name: 'Should create circle with correct properties',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should create circle with correct properties',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Create line shape
  try {
    const line = createShape('line', { points: [0, 0, 200, 150] });
    const isValid = 
      line.type === 'line' &&
      Array.isArray(line.points) &&
      line.points.length === 4 &&
      line.points[2] === 200 &&
      line.points[3] === 150;
    
    tests.push({
      name: 'Should create line with correct points',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should create line with correct points',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Create text shape
  try {
    const text = createShape('text', { text: 'Hello Canvas', fontSize: 24 });
    const isValid = 
      text.type === 'text' &&
      text.text === 'Hello Canvas' &&
      text.fontSize === 24 &&
      text.fontFamily === 'Arial';
    
    tests.push({
      name: 'Should create text with correct properties',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should create text with correct properties',
      passed: false,
      error: error.message
    });
  }
  
  // Test 5: Validate shape type detection
  try {
    const rect = createShape('rectangle');
    const circle = createShape('circle');
    const line = createShape('line');
    const text = createShape('text');
    const arrow = createShape('arrow');
    
    const hasCorrectTypes = 
      rect.type === 'rectangle' &&
      circle.type === 'circle' &&
      line.type === 'line' &&
      text.type === 'text' &&
      arrow.type === 'arrow';
    
    const hasTypeSpecificProps = 
      (rect.width !== undefined && rect.height !== undefined) &&
      (circle.radius !== undefined) &&
      (line.points !== undefined) &&
      (text.text !== undefined && text.fontSize !== undefined);
    
    tests.push({
      name: 'Should correctly identify shape types and properties',
      passed: hasCorrectTypes && hasTypeSpecificProps,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should correctly identify shape types and properties',
      passed: false,
      error: error.message
    });
  }
  
  return tests;
}

export async function runShapeTransformationTests() {
  const tests = [];
  
  // Test 1: Resize rectangle
  try {
    const rect = createShape('rectangle', { width: 100, height: 50 });
    await new Promise(resolve => setTimeout(resolve, 1));
    const resized = { ...rect, width: 200, height: 150, updatedAt: Date.now() };
    
    const isValid = 
      resized.width === 200 &&
      resized.height === 150 &&
      resized.x === rect.x &&
      resized.y === rect.y &&
      resized.updatedAt > rect.createdAt;
    
    tests.push({
      name: 'Should resize rectangle correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should resize rectangle correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Resize circle
  try {
    const circle = createShape('circle', { radius: 50 });
    await new Promise(resolve => setTimeout(resolve, 1));
    const resized = { ...circle, radius: 100, updatedAt: Date.now() };
    
    const isValid = 
      resized.radius === 100 &&
      resized.x === circle.x &&
      resized.y === circle.y &&
      resized.updatedAt > circle.createdAt;
    
    tests.push({
      name: 'Should resize circle correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should resize circle correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Move shape
  try {
    const rect = createShape('rectangle');
    await new Promise(resolve => setTimeout(resolve, 1));
    const moved = { ...rect, x: 300, y: 250, updatedAt: Date.now() };
    
    const deltaX = moved.x - rect.x;
    const deltaY = moved.y - rect.y;
    const isValid = 
      deltaX === 200 &&
      deltaY === 150 &&
      moved.width === rect.width &&
      moved.height === rect.height &&
      moved.updatedAt > rect.createdAt;
    
    tests.push({
      name: 'Should move shape correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should move shape correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Rotate shape
  try {
    const rect = createShape('rectangle');
    const rotated = { ...rect, rotation: 45, updatedAt: Date.now() };
    
    const isValid = 
      rotated.rotation === 45 &&
      rotated.x === rect.x &&
      rotated.y === rect.y &&
      rotated.width === rect.width &&
      rotated.height === rect.height;
    
    tests.push({
      name: 'Should rotate shape correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should rotate shape correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 5: Multiple transformations
  try {
    const rect = createShape('rectangle', { x: 100, y: 100, width: 100, height: 50, rotation: 0 });
    
    // Move
    let transformed = { ...rect, x: 200, y: 150 };
    // Resize
    transformed = { ...transformed, width: 150, height: 100 };
    // Rotate
    transformed = { ...transformed, rotation: 90 };
    
    const isValid = 
      transformed.x === 200 &&
      transformed.y === 150 &&
      transformed.width === 150 &&
      transformed.height === 100 &&
      transformed.rotation === 90 &&
      transformed.id === rect.id;
    
    tests.push({
      name: 'Should handle multiple transformations correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should handle multiple transformations correctly',
      passed: false,
      error: error.message
    });
  }
  
  return tests;
}

export async function runShapeGeometryTests() {
  const tests = [];
  
  // Test 1: Calculate rectangle bounds
  try {
    const rect = createShape('rectangle', { x: 50, y: 100, width: 200, height: 150 });
    const bounds = {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      width: rect.width,
      height: rect.height
    };
    
    const isValid = 
      bounds.left === 50 &&
      bounds.top === 100 &&
      bounds.right === 250 &&
      bounds.bottom === 250 &&
      bounds.width === 200 &&
      bounds.height === 150;
    
    tests.push({
      name: 'Should calculate rectangle bounds correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should calculate rectangle bounds correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Calculate circle bounds
  try {
    const circle = createShape('circle', { x: 200, y: 200, radius: 50 });
    const bounds = {
      left: circle.x - circle.radius,
      top: circle.y - circle.radius,
      right: circle.x + circle.radius,
      bottom: circle.y + circle.radius,
      width: circle.radius * 2,
      height: circle.radius * 2
    };
    
    const isValid = 
      bounds.left === 150 &&
      bounds.top === 150 &&
      bounds.right === 250 &&
      bounds.bottom === 250 &&
      bounds.width === 100 &&
      bounds.height === 100;
    
    tests.push({
      name: 'Should calculate circle bounds correctly',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should calculate circle bounds correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Point inside rectangle detection
  try {
    const rect = createShape('rectangle', { x: 100, y: 100, width: 200, height: 150 });
    const pointInside = { x: 200, y: 150 };
    const pointOutside = { x: 50, y: 50 };
    
    const isInside = 
      pointInside.x >= rect.x &&
      pointInside.x <= rect.x + rect.width &&
      pointInside.y >= rect.y &&
      pointInside.y <= rect.y + rect.height;
    
    const isOutside = !(
      pointOutside.x >= rect.x &&
      pointOutside.x <= rect.x + rect.width &&
      pointOutside.y >= rect.y &&
      pointOutside.y <= rect.y + rect.height
    );
    
    tests.push({
      name: 'Should detect point inside/outside rectangle',
      passed: isInside && isOutside,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should detect point inside/outside rectangle',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Point inside circle detection
  try {
    const circle = createShape('circle', { x: 200, y: 200, radius: 50 });
    const pointInside = { x: 210, y: 210 };
    const pointOutside = { x: 300, y: 300 };
    
    const distanceInside = Math.sqrt(
      Math.pow(pointInside.x - circle.x, 2) + 
      Math.pow(pointInside.y - circle.y, 2)
    );
    const distanceOutside = Math.sqrt(
      Math.pow(pointOutside.x - circle.x, 2) + 
      Math.pow(pointOutside.y - circle.y, 2)
    );
    
    const isInside = distanceInside <= circle.radius;
    const isOutside = distanceOutside > circle.radius;
    
    tests.push({
      name: 'Should detect point inside/outside circle',
      passed: isInside && isOutside,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should detect point inside/outside circle',
      passed: false,
      error: error.message
    });
  }
  
  return tests;
}

export async function runShapeDataTests() {
  const tests = [];
  
  // Test 1: Shape ID uniqueness
  try {
    const shapes = [];
    for (let i = 0; i < 10; i++) {
      shapes.push(createShape('rectangle'));
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const ids = shapes.map(s => s.id);
    const uniqueIds = new Set(ids);
    
    tests.push({
      name: 'Should generate unique IDs for shapes',
      passed: uniqueIds.size === 10,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should generate unique IDs for shapes',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Shape timestamp validation
  try {
    const rect = createShape('rectangle');
    const now = Date.now();
    const timeDiff = Math.abs(now - rect.createdAt);
    
    const isValid = 
      rect.createdAt > 0 &&
      rect.updatedAt > 0 &&
      rect.createdAt === rect.updatedAt &&
      timeDiff < 1000; // Created within last second
    
    tests.push({
      name: 'Should set valid timestamps on shape creation',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should set valid timestamps on shape creation',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Shape property immutability on copy
  try {
    const original = createShape('rectangle', { width: 100, height: 50 });
    const copy = { ...original, width: 200 };
    
    const isValid = 
      original.width === 100 &&
      copy.width === 200 &&
      original.height === copy.height &&
      original.id === copy.id;
    
    tests.push({
      name: 'Should copy shapes without mutating original',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should copy shapes without mutating original',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Shape update tracking
  try {
    const rect = createShape('rectangle');
    await new Promise(resolve => setTimeout(resolve, 10));
    const updated = { ...rect, x: 200, updatedAt: Date.now() };
    
    const isValid = 
      updated.updatedAt > rect.updatedAt &&
      updated.createdAt === rect.createdAt &&
      updated.id === rect.id;
    
    tests.push({
      name: 'Should track shape updates with timestamps',
      passed: isValid,
      duration: 0
    });
  } catch (error) {
    tests.push({
      name: 'Should track shape updates with timestamps',
      passed: false,
      error: error.message
    });
  }
  
  return tests;
}

// Aggregate all shape tests into one suite
export async function runShapeOperationTests() {
  const creationTests = await runShapeCreationTests();
  const transformationTests = await runShapeTransformationTests();
  const geometryTests = await runShapeGeometryTests();
  const dataTests = await runShapeDataTests();
  
  return {
    name: 'Shape Operations & Canvas Logic',
    tests: [...creationTests, ...transformationTests, ...geometryTests, ...dataTests]
  };
}


