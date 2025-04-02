import { createRandStr } from "../utils/createRandStr.js";

const type = "rasterFill";
const name = "Raster Fill";

export const rasterFill = {
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

    const allScanLines = [];
    const medialPolylines = [];

    for (const child of inputGeometry) {
      // Sort polylines by length (descending) to identify outer boundary and holes
      const sortedPolylines = [...child.polylines].sort(
        (a, b) => b.length - a.length
      );

      if (sortedPolylines.length > 0 && isPolygonClosed(sortedPolylines[0])) {
        const outerBoundary = sortedPolylines[0];
        const holes = sortedPolylines.slice(1).filter(isPolygonClosed);

        // Calculate center point for rotation
        const center = calculateCenter(outerBoundary);

        // Rotate the polygon and holes by -angle
        const rotatedOuterBoundary = outerBoundary.map((point) =>
          rotatePoint(point, center, -angle)
        );
        const rotatedHoles = holes.map((hole) =>
          hole.map((point) => rotatePoint(point, center, -angle))
        );

        const scanLines = rasterizePolygonWithHoles(
          rotatedOuterBoundary,
          rotatedHoles,
          density
        );

        // Group scan lines into connected sections
        const groupedScanLines = groupScanLines(scanLines, density);

        // Convert each scan line to polylines and rotate back, adding group attributes
        const rotatedScanLines = groupedScanLines
          .map((group, groupIndex) =>
            group.map((line) => ({
              polylines: [
                line.map(([x, y]) => {
                  // Rotate the point back by the original angle
                  const [rotatedX, rotatedY] = rotatePoint(
                    [x, y],
                    center,
                    angle
                  );
                  return [rotatedX, rotatedY];
                }),
              ],
              attributes: {
                stroke: `hsl(${(groupIndex * 137.5) % 360}, 70%, 50%)`, // Golden angle to get good color distribution
              },
            }))
          )
          .flat();

        // Create medial polylines for each group
        const rotatedMedialPolylines = groupedScanLines.map(
          (group, groupIndex) => {
            // Calculate medial points for each scan line in the group
            const medialPoints = group.map((line) => {
              const x1 = line[0][0];
              const y1 = line[0][1];
              const x2 = line[line.length - 1][0];
              const y2 = line[line.length - 1][1];
              const midX = (x1 + x2) / 2;
              const midY = y1; // y1 and y2 are the same for horizontal scan lines

              // Rotate the medial point back by the original angle
              return rotatePoint([midX, midY], center, angle);
            });

            // Create a polyline connecting all medial points
            return {
              polylines: [medialPoints],
              attributes: {
                stroke: `hsl(${(groupIndex * 137.5) % 360}, 70%, 50%)`,
                strokeDasharray: "5,5", // Make the medial line dashed
              },
            };
          }
        );

        // Connect medial lines between groups
        const medialConnections = [];
        for (let i = 0; i < groupedScanLines.length; i++) {
          for (let j = i + 1; j < groupedScanLines.length; j++) {
            const group1 = groupedScanLines[i];
            const group2 = groupedScanLines[j];

            // Find the closest medial points between the two groups
            let closestPoints = null;
            let minDistance = Infinity;

            for (const line1 of group1) {
              const x1 = line1[0][0];
              const y1 = line1[0][1];
              const x2 = line1[line1.length - 1][0];
              const midX1 = (x1 + x2) / 2;

              for (const line2 of group2) {
                const x3 = line2[0][0];
                const y2 = line2[0][1];
                const x4 = line2[line2.length - 1][0];
                const midX2 = (x3 + x4) / 2;

                // Check if x-ranges overlap
                if (
                  !(
                    Math.max(x1, x2) < Math.min(x3, x4) ||
                    Math.min(x1, x2) > Math.max(x3, x4)
                  )
                ) {
                  const distance = Math.abs(y2 - y1);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestPoints = {
                      point1: rotatePoint([midX1, y1], center, angle),
                      point2: rotatePoint([midX2, y2], center, angle),
                    };
                  }
                }
              }
            }

            // If we found close points, create a connection
            if (closestPoints && minDistance < 2) {
              // 2 is a threshold for connection distance
              medialConnections.push({
                polylines: [[closestPoints.point1, closestPoints.point2]],
                attributes: {
                  stroke: `hsl(${((i + j) * 137.5) % 360}, 70%, 50%)`,
                  strokeDasharray: "3,3", // Make the connections dashed
                },
              });
            }
          }
        }

        allScanLines.push(...rotatedScanLines);
        medialPolylines.push(...rotatedMedialPolylines, ...medialConnections);
      }
    }

    return [...allScanLines, ...medialPolylines];
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

function rasterizePolygonWithHoles(polygon, holes, stepSize) {
  // 1. Find the polygon's bounding box
  let minX = polygon[0][0];
  let maxX = polygon[0][0];
  let minY = polygon[0][1];
  let maxY = polygon[0][1];

  // Include holes in bounding box calculation
  const allPoints = [polygon, ...holes].flat();
  for (const [x, y] of allPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // 2. Generate scan lines
  const scanLines = [];

  for (let scanY = minY; scanY <= maxY; scanY += stepSize) {
    // 3. Find all intersection points with the outer boundary
    const outerIntersections = findHorizontalIntersections(polygon, scanY);

    // 4. Find all intersection points with holes
    const holeIntersections = holes.flatMap((hole) =>
      findHorizontalIntersections(hole, scanY)
    );

    // 5. Combine and sort all intersections
    const allIntersections = [...outerIntersections, ...holeIntersections].sort(
      (a, b) => a - b
    );

    // 6. Create scan lines from pairs of intersections
    // The first intersection starts a line, the second ends it
    // The third starts a new line, the fourth ends it, and so on
    for (let i = 0; i < allIntersections.length - 1; i += 2) {
      const x1 = allIntersections[i];
      const x2 = allIntersections[i + 1];
      scanLines.push([
        [x1, scanY],
        [x2, scanY],
      ]);
    }
  }

  return scanLines;
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

function groupScanLines(scanLines, stepSize) {
  // Sort scan lines by y-coordinate (bottom to top)
  const sortedLines = [...scanLines].sort((a, b) => a[0][1] - b[0][1]);
  const groups = [];
  const processedLines = new Set();

  while (processedLines.size < sortedLines.length) {
    const currentGroup = [];
    let currentLineIndex = findLowestUnprocessedLine(
      sortedLines,
      processedLines
    );

    if (currentLineIndex === -1) break;

    // Start a new group from the lowest unprocessed line
    let currentLine = sortedLines[currentLineIndex];
    currentGroup.push(currentLine);
    processedLines.add(currentLineIndex);

    // Follow connected lines upward
    while (true) {
      const nextLineIndex = findNextValidLine(
        sortedLines,
        currentLine,
        processedLines,
        stepSize
      );

      if (nextLineIndex === -1) break;

      currentLine = sortedLines[nextLineIndex];
      currentGroup.push(currentLine);
      processedLines.add(nextLineIndex);
    }

    groups.push(currentGroup);
  }

  return groups;
}

function findLowestUnprocessedLine(sortedLines, processedLines) {
  for (let i = 0; i < sortedLines.length; i++) {
    if (!processedLines.has(i)) {
      return i;
    }
  }
  return -1;
}

function findNextValidLine(sortedLines, currentLine, processedLines, stepSize) {
  const currentY = currentLine[0][1];

  // Find all unprocessed lines above the current line
  for (let i = 0; i < sortedLines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = sortedLines[i];
    if (line[0][1] <= currentY) continue;

    // Check if there's a valid vertical path
    if (
      hasValidVerticalPath(
        currentLine,
        line,
        sortedLines,
        processedLines,
        stepSize
      )
    ) {
      return i;
    }
  }

  return -1;
}

function hasValidVerticalPath(
  line1,
  line2,
  allLines,
  processedLines,
  stepSize
) {
  // Get x ranges of both lines
  const x1Min = Math.min(...line1.map((p) => p[0]));
  const x1Max = Math.max(...line1.map((p) => p[0]));
  const x2Min = Math.min(...line2.map((p) => p[0]));
  const x2Max = Math.max(...line2.map((p) => p[0]));

  // Check if x ranges overlap
  if (x1Max < x2Min || x2Max < x1Min) {
    return false;
  }

  if (Math.abs(line1[0][1] - line2[0][1]) > stepSize * 1.3) {
    return false;
  }

  // Get the overlap region
  const overlapMinX = Math.max(x1Min, x2Min);
  const overlapMaxX = Math.min(x1Max, x2Max);

  // Check if any processed line is in between
  for (let i = 0; i < allLines.length; i++) {
    if (!processedLines.has(i)) continue;

    const line = allLines[i];
    const lineY = line[0][1];

    // Only check lines between our two points
    if (
      lineY <= Math.min(line1[0][1], line2[0][1]) ||
      lineY >= Math.max(line1[0][1], line2[0][1])
    )
      continue;

    // Get x range of this line
    const lineXMin = Math.min(...line.map((p) => p[0]));
    const lineXMax = Math.max(...line.map((p) => p[0]));

    // Check if this line's x range overlaps with our overlap region
    if (!(lineXMax < overlapMinX || lineXMin > overlapMaxX)) {
      return false;
    }
  }

  return true;
}
