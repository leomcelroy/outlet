import { createRandStr } from "../utils/createRandStr.js";

const type = "offset";
const name = "Offset";

export const offset = {
  type,
  name,
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type,
      enabled: true,
      controls: [
        {
          id: "distance",
          type: "number",
          value: options.distance || 10,
          min: -100,
          max: 100,
          step: 1,
        },
        {
          id: "joinType",
          type: "select",
          value: options.joinType || "miter",
          options: [
            { value: "round", label: "Round" },
            { value: "miter", label: "Miter" },
            { value: "bevel", label: "Bevel" },
          ],
        },
        {
          id: "miterLimit",
          type: "number",
          value: options.miterLimit || 4,
          min: 1,
          max: 100,
          step: 0.1,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { distance, joinType, miterLimit } = controls;
    
    // Process each input geometry
    return inputGeometry.map((path) => {
      const offsetPolylines = [];
      
      // Process each polyline in the path
      path.polylines.forEach((polyline) => {
        // Skip empty polylines or polylines with less than 2 points
        if (!polyline || polyline.length < 2) return;
        
        // Check if polyline is closed (first and last points match)
        const isClosed = isPolylineClosed(polyline);
        
        // Generate offset polyline
        const offsetPolyline = offsetPolylinePath(polyline, distance, joinType, miterLimit, isClosed);
        
        if (offsetPolyline && offsetPolyline.length > 0) {
          offsetPolylines.push(offsetPolyline);
        }
      });
      
      return {
        polylines: offsetPolylines,
        attributes: path.attributes,
      };
    });
  },
};

// Helper function to check if a polyline is closed
function isPolylineClosed(polyline) {
  if (polyline.length < 3) return false;
  
  const firstPoint = polyline[0];
  const lastPoint = polyline[polyline.length - 1];
  
  // Check if first and last points are very close
  const dx = firstPoint[0] - lastPoint[0];
  const dy = firstPoint[1] - lastPoint[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < 1.0; // Allow a small tolerance
}

// Function to calculate the normal vector for a line segment
function calculateNormal(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Return normalized perpendicular vector (counter-clockwise rotation)
  return length > 0 ? [-dy / length, dx / length] : [0, 0];
}

// Function to offset a polyline by a given distance
function offsetPolylinePath(polyline, distance, joinType, miterLimit, isClosed) {
  if (polyline.length < 2) return [];
  
  // Make a deep copy to avoid modifying the original
  const originalPolyline = JSON.parse(JSON.stringify(polyline));
  
  // If the polyline is closed, ensure last point equals first point
  if (isClosed && !pointsEqual(originalPolyline[0], originalPolyline[originalPolyline.length - 1])) {
    originalPolyline.push([...originalPolyline[0]]);
  }
  
  // For simplicity, let's make calculations with absolute distance and invert if needed
  const absDistance = Math.abs(distance);
  const direction = distance >= 0 ? 1 : -1;
  
  const result = [];
  const segments = [];
  
  // Calculate segment vectors and normals
  for (let i = 0; i < originalPolyline.length - 1; i++) {
    const p1 = originalPolyline[i];
    const p2 = originalPolyline[i + 1];
    
    // Skip zero-length segments
    if (pointsEqual(p1, p2)) continue;
    
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate normal vector (perpendicular to the segment, pointing outward)
    const nx = -dy / length * direction;
    const ny = dx / length * direction;
    
    segments.push({
      p1: p1,
      p2: p2,
      normal: [nx, ny]
    });
  }
  
  if (segments.length === 0) return [];
  
  // For closed polylines, we need to handle the loop differently
  if (isClosed && segments.length > 1) {
    // For closed paths, we need to handle the first/last connection properly
    const result = processClosedPath(segments, absDistance, joinType, miterLimit, direction);
    return result;
  } else {
    // For open polylines, we start and end with simple offsets
    return processOpenPath(segments, absDistance, joinType, miterLimit, direction);
  }
}

function processOpenPath(segments, distance, joinType, miterLimit, direction) {
  const result = [];
  
  // Start point is offset perpendicular to the first segment
  const firstSeg = segments[0];
  result.push([
    firstSeg.p1[0] + firstSeg.normal[0] * distance,
    firstSeg.p1[1] + firstSeg.normal[1] * distance
  ]);
  
  // Process each corner (intersection of two segments)
  for (let i = 0; i < segments.length - 1; i++) {
    processCorner(segments[i], segments[i+1], result, distance, joinType, miterLimit, direction);
  }
  
  // End point is offset perpendicular to the last segment
  const lastSeg = segments[segments.length - 1];
  result.push([
    lastSeg.p2[0] + lastSeg.normal[0] * distance,
    lastSeg.p2[1] + lastSeg.normal[1] * distance
  ]);
  
  return result;
}

function processClosedPath(segments, distance, joinType, miterLimit, direction) {
  const result = [];
  
  // Process each corner in the closed path
  for (let i = 0; i < segments.length; i++) {
    const curr = segments[i];
    const next = segments[(i + 1) % segments.length];
    
    // Add the starting point for this segment
    const offsetPoint = [
      curr.p1[0] + curr.normal[0] * distance, 
      curr.p1[1] + curr.normal[1] * distance
    ];
    
    // Only add points if we're starting the path or the point is different
    if (result.length === 0 || !pointsEqual(offsetPoint, result[result.length - 1])) {
      result.push(offsetPoint);
    }
    
    // Process the corner between current and next segment
    processCorner(curr, next, result, distance, joinType, miterLimit, direction);
  }
  
  // Close the path by adding the first point again if needed
  if (result.length > 0 && !pointsEqual(result[0], result[result.length - 1])) {
    result.push([...result[0]]);
  }
  
  return result;
}

function processCorner(curr, next, result, distance, joinType, miterLimit, direction) {
  // Skip if the segments' end points don't match
  if (!pointsEqual(curr.p2, next.p1)) return;
  
  const cornerPoint = curr.p2; // The actual corner point
  
  // Calculate offset points for the current and next segment
  const currOffset = [
    cornerPoint[0] + curr.normal[0] * distance,
    cornerPoint[1] + curr.normal[1] * distance
  ];
  
  const nextOffset = [
    cornerPoint[0] + next.normal[0] * distance,
    cornerPoint[1] + next.normal[1] * distance
  ];
  
  // Skip duplicate points
  if (pointsEqual(currOffset, nextOffset)) {
    return;
  }
  
  // Calculate the dot product to determine if this is an internal or external corner
  const dot = curr.normal[0] * next.normal[0] + curr.normal[1] * next.normal[1];
  const cross = curr.normal[0] * next.normal[1] - curr.normal[1] * next.normal[0];
  const isInternalCorner = (cross * direction < 0);
  
  // Handle different join types
  if (joinType === 'miter') {
    // Calculate intersection of the offset lines
    const intersection = lineIntersection(
      [curr.p1[0] + curr.normal[0] * distance, curr.p1[1] + curr.normal[1] * distance],
      currOffset,
      nextOffset,
      [next.p2[0] + next.normal[0] * distance, next.p2[1] + next.normal[1] * distance]
    );
    
    if (intersection) {
      // Check miter limit
      const dx1 = intersection[0] - cornerPoint[0];
      const dy1 = intersection[1] - cornerPoint[1];
      const miterDistance = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      if (miterDistance <= distance * miterLimit) {
        result.push(intersection);
      } else {
        // Fallback to bevel join if miter limit is exceeded
        result.push(currOffset);
        result.push(nextOffset);
      }
    } else {
      // If lines are parallel, use bevel join
      result.push(currOffset);
      result.push(nextOffset);
    }
  } else if (joinType === 'bevel') {
    result.push(currOffset);
    result.push(nextOffset);
  } else if (joinType === 'round') {
    // Add the first offset point
    result.push(currOffset);
    
    // Get vectors from corner to offset points
    const v1 = [currOffset[0] - cornerPoint[0], currOffset[1] - cornerPoint[1]];
    const v2 = [nextOffset[0] - cornerPoint[0], nextOffset[1] - cornerPoint[1]];
    
    // Normalize vectors
    const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    
    const v1n = [v1[0] / len1, v1[1] / len1];
    const v2n = [v2[0] / len2, v2[1] / len2];
    
    // Calculate dot product and determine angle
    const dotProduct = v1n[0] * v2n[0] + v1n[1] * v2n[1];
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    
    // Determine direction (clockwise or counter-clockwise)
    const crossProduct = v1n[0] * v2n[1] - v1n[1] * v2n[0];
    const clockwise = (crossProduct * direction < 0);
    
    // Generate arc points
    const steps = Math.max(8, Math.ceil(angle * 4 / Math.PI));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      
      // Use quaternion slerp-like interpolation for smooth arcs
      const sinT = Math.sin(angle * t);
      const sinOneMinusT = Math.sin(angle * (1 - t));
      const sinAngle = Math.sin(angle);
      
      const factorV1 = sinOneMinusT / sinAngle;
      const factorV2 = sinT / sinAngle;
      
      // If points are too close, we might get NaN - handle that case
      let x, y;
      if (!isNaN(factorV1) && !isNaN(factorV2)) {
        x = cornerPoint[0] + (v1n[0] * factorV1 + v2n[0] * factorV2) * distance;
        y = cornerPoint[1] + (v1n[1] * factorV1 + v2n[1] * factorV2) * distance;
      } else {
        // Simple linear interpolation as fallback
        x = cornerPoint[0] + (v1n[0] * (1 - t) + v2n[0] * t) * distance;
        y = cornerPoint[1] + (v1n[1] * (1 - t) + v2n[1] * t) * distance;
      }
      
      result.push([x, y]);
    }
    
    // Add the second offset point
    result.push(nextOffset);
  }
}

// Line intersection helper
function lineIntersection(p1, p2, p3, p4) {
  // Line 1 represented as a1x + b1y = c1
  const a1 = p2[1] - p1[1];
  const b1 = p1[0] - p2[0];
  const c1 = a1 * p1[0] + b1 * p1[1];
  
  // Line 2 represented as a2x + b2y = c2
  const a2 = p4[1] - p3[1];
  const b2 = p3[0] - p4[0];
  const c2 = a2 * p3[0] + b2 * p3[1];
  
  const determinant = a1 * b2 - a2 * b1;
  
  if (Math.abs(determinant) < 0.0001) {
    // Lines are parallel
    return null;
  }
  
  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;
  
  return [x, y];
}

// Helper function to check if two points are equal
function pointsEqual(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy) < 0.0001;
}