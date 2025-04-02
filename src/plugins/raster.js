import { createRandStr } from "../utils/createRandStr.js";
import { PolygonMask } from "../utils/masks/PolygonMask.js";

const type = "raster";
const name = "Raster";

export const raster = {
  type,
  name,
  init() {
    return {
      id: createRandStr(),
      name,
      enabled: true,
      type,
      controls: [
        {
          id: "density",
          type: "number",
          label: "Density",
          value: 1,
        },
        {
          id: "angle",
          type: "number",
          label: "Angle (degrees)",
          value: 0,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { density, angle } = controls;

    if (density < 1) {
      return inputGeometry;
    }

    // Create a map to store paths by ID
    const pathsByID = new Map();

    for (const child of inputGeometry) {
      for (const polyline of child.polylines) {
        if (isPolygonClosed(polyline)) {
          // Calculate center point for rotation
          const center = calculateCenter(polyline);

          // Rotate the polygon by -angle (to align with horizontal scan lines)
          const rotatedPolygon = polyline.map((point) =>
            rotatePoint(point, center, -angle)
          );

          const rasterized = rasterizePolygonZigZag(rotatedPolygon, density);
          const pathSegments = createPathSegments(rasterized, density * 2);

          // Convert each segment to polylines and rotate back
          const polylines = pathSegments.map((segment) =>
            segment.map(([x, y]) => {
              // Rotate the point back by the original angle
              const [rotatedX, rotatedY] = rotatePoint([x, y], center, angle);
              return [rotatedX, rotatedY];
            })
          );

          // If we already have data for this ID, append to it
          if (pathsByID.has(child.id)) {
            const existingPolylines = pathsByID.get(child.id);
            pathsByID.set(child.id, [...existingPolylines, ...polylines]);
          } else {
            pathsByID.set(child.id, polylines);
          }
        }
      }
    }

    // Convert the map back to an array of paths
    return Array.from(pathsByID.entries()).map(([id, polylines]) => ({
      polylines,
      attributes: {},
    }));
  },
};

function isPolygonClosed(polygon) {
  if (polygon.length < 3) return false;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  // Check if first and last points are within a certain distance of each other
  const margin = 0.1;
  const dx = first[0] - last[0];
  const dy = first[1] - last[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < margin;
}

function rasterizePolygonZigZag(polygon, stepSize) {
  // 1. Find the polygon's bounding box
  let minX = polygon[0][0];
  let maxX = polygon[0][0];
  let minY = polygon[0][1];
  let maxY = polygon[0][1];
  for (let i = 1; i < polygon.length; i++) {
    const x = polygon[i][0];
    const y = polygon[i][1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // 2. Gather polylines row by row
  const polylines = [];
  let direction = 1;

  for (let scanY = minY; scanY <= maxY; scanY += stepSize) {
    // 3. Find all intersection points of the polygon with the horizontal line y=scanY
    const intersections = findHorizontalIntersections(polygon, scanY);
    // Sort them left to right
    intersections.sort((a, b) => a - b);

    // 4. Build horizontal segments from each pair of intersections
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = intersections[i];
      const x2 = intersections[i + 1];

      // If we're going left->right, record that line directly;
      // if right->left, reverse it to avoid extra travel.
      if (direction === 1) {
        polylines.push([
          [x1, scanY],
          [x2, scanY],
        ]);
      } else {
        polylines.push([
          [x2, scanY],
          [x1, scanY],
        ]);
      }
    }

    // Flip direction for the next row
    direction *= -1;
  }

  return polylines;
}

/**
 * Returns an array of x-coordinates where the horizontal line y=scanY
 * intersects the polygon.
 */
function findHorizontalIntersections(polygon, scanY) {
  const xs = [];

  // Loop over each edge of the polygon
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];

    const y1 = p1[1];
    const y2 = p2[1];
    const x1 = p1[0];
    const x2 = p2[0];

    // Check if the horizontal line crosses between y1 and y2
    // (strictly inside, ignoring exact matches for simplicity)
    const minEdgeY = Math.min(y1, y2);
    const maxEdgeY = Math.max(y1, y2);
    if (scanY > minEdgeY && scanY <= maxEdgeY && y1 !== y2) {
      // Linear interpolation to find the intersection x
      const t = (scanY - y1) / (y2 - y1);
      const intersectX = x1 + t * (x2 - x1);
      xs.push(intersectX);
    }
  }

  return xs;
}

function createPathSegments(rasterized, maxConnectionDistance = 10) {
  // Sort scan lines by y-coordinate (bottom to top)
  const sortedLines = [...rasterized].sort((a, b) => a[0][1] - b[0][1]);

  // Create path segments by connecting lines upward
  const pathSegments = [];
  const processedLines = new Set();
  let startFromLeft = true; // Track whether to start from left or right

  while (processedLines.size < sortedLines.length) {
    // Find the lowest unprocessed line
    let currentLineIndex = 0;
    while (processedLines.has(currentLineIndex)) {
      currentLineIndex++;
    }

    // Start a new path segment
    let currentLine = sortedLines[currentLineIndex];

    // If we're starting from the right, reverse the initial line
    if (!startFromLeft) {
      currentLine = [...currentLine].reverse();
    }

    const currentSegment = [...currentLine];
    processedLines.add(currentLineIndex);

    // Try to connect upward
    while (true) {
      // Find the next line up that hasn't been processed
      let nextLineIndex = -1;
      let nextLineY = Infinity;
      let minDistance = Infinity;

      for (let i = 0; i < sortedLines.length; i++) {
        if (!processedLines.has(i)) {
          const lineY = sortedLines[i][0][1];
          if (lineY > currentLine[0][1] && lineY < nextLineY) {
            // Calculate distance from current end to next line's start
            const currentEnd = currentLine[currentLine.length - 1];
            const nextStart = sortedLines[i][0];

            const distance = Math.hypot(
              currentEnd[0] - nextStart[0],
              currentEnd[1] - nextStart[1]
            );

            if (distance < minDistance) {
              minDistance = distance;
              nextLineIndex = i;
              nextLineY = lineY;
            }
          }
        }
      }

      // If we found a line above and it's within the maximum distance, connect to it
      if (nextLineIndex !== -1 && minDistance <= maxConnectionDistance) {
        const nextLine = sortedLines[nextLineIndex];
        const currentEnd = currentLine[currentLine.length - 1];
        const nextStart = nextLine[0];

        // Add connecting line
        currentSegment.push([currentEnd[0], currentEnd[1]]);
        currentSegment.push([nextStart[0], nextStart[1]]);

        // Add the next line
        currentSegment.push(...nextLine);

        // Update state
        currentLine = nextLine;
        currentLineIndex = nextLineIndex;
        processedLines.add(currentLineIndex);
      } else {
        // No more lines above or the next line is too far, add this segment and break the loop
        pathSegments.push(currentSegment);
        break;
      }
    }

    // Flip the starting direction for the next segment
    startFromLeft = !startFromLeft;
  }

  return pathSegments;
}

// Helper function to calculate the center point of a polygon
function calculateCenter(polygon) {
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of polygon) {
    sumX += x;
    sumY += y;
  }
  return [sumX / polygon.length, sumY / polygon.length];
}

// Helper function to rotate a point around a center
function rotatePoint(point, center, angleDegrees) {
  const [x, y] = point;
  const [cx, cy] = center;
  const angleRadians = (angleDegrees * Math.PI) / 180;

  // Translate point to origin
  const dx = x - cx;
  const dy = y - cy;

  // Rotate
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;

  // Translate back
  return [rotatedX + cx, rotatedY + cy];
}
