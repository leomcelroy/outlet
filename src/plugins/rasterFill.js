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
        {
          id: "joinPaths",
          type: "boolean",
          label: "Join Paths",
          value: false,
        },
        {
          id: "colorFillSections",
          type: "boolean",
          label: "Color Fill Sections",
          value: false,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    let { density, angle, joinPaths, colorFillSections } = controls;

    if (density < 0.2) {
      density = 0.2;
    }

    const center = [0, 0];
    const allPaths = [];

    for (const child of inputGeometry) {
      const sortedPolylines = [...child.polylines].sort(
        (a, b) => b.length - a.length
      );

      if (sortedPolylines.length > 0 && isPolygonClosed(sortedPolylines[0])) {
        const outerBoundary = sortedPolylines[0];
        const holes = sortedPolylines.slice(1).filter(isPolygonClosed);

        const rotatedOuterBoundary = outerBoundary.map((point) =>
          rotatePoint(point, center, -angle)
        );
        const rotatedHoles = holes.map((hole) =>
          hole.map((point) => rotatePoint(point, center, -angle))
        );

        // Each scan line now gets an id so we can reference it later
        const scanLines = rasterizePolygonWithHoles(
          rotatedOuterBoundary,
          rotatedHoles,
          density
        );

        const groupedScanLines = groupScanLines(scanLines, density);

        // Map scanline groups into geometry objects with polylines (array of arrays)
        const sorted = groupedScanLines.reverse().map((group, groupIndex) => {
          const zigzagPoints = [];
          group.forEach((scanLine, i) => {
            zigzagPoints.push(
              i % 2 === 0 ? scanLine.points[0] : scanLine.points[1]
            );
          });

          return {
            polylines: [zigzagPoints],
            attributes: {
              scanlineIds: group.map((scanLine) => scanLine.id),
              stroke: colorFillSections
                ? `hsl(${(groupIndex * 137.5) % 360}, 70%, 50%)`
                : "black",
            },
          };
        });

        // Build medial graph with nodes having { id, point }
        const medialGraph = makeMedialLineGraph(scanLines, density);

        // Create merged path using medial graph for connecting paths
        const mergedPath = createMergedPath(sorted, medialGraph);

        if (joinPaths) {
          allPaths.push(mergedPath);
        } else {
          allPaths.push(
            ...sorted
            // medialGraph.polylines,
            // mergedPath
          );
        }
      }
    }

    return rotateGeometry(allPaths, center, angle);
  },
};

function rotateGeometry(geometry, center, angle) {
  return geometry.map((child) => ({
    ...child,
    polylines: rotatePolylines(child.polylines, center, angle),
  }));
}

function rotatePolylines(polylines, center, angle) {
  return polylines.map((polyline) =>
    polyline.map((point) => rotatePoint(point, center, angle))
  );
}

function findPathBetweenNodes(startId, endId, visitedNodes, medialGraph) {
  // If either node is already visited, return empty path
  if (visitedNodes.has(startId) || visitedNodes.has(endId)) {
    return [];
  }

  // Create a queue for BFS and a map to track the path
  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNodeId = path[path.length - 1];

    // If we reached the end node, convert the path to points
    if (currentNodeId === endId) {
      return path.map(
        (nodeId) => medialGraph.nodes.find((n) => n.id === nodeId).point
      );
    }

    // Find all unvisited neighbors
    const neighbors = medialGraph.edges
      .filter(([from, to]) => from === currentNodeId || to === currentNodeId)
      .map(([from, to]) => (from === currentNodeId ? to : from))
      .filter((id) => !visited.has(id) && !visitedNodes.has(id));

    // Add each neighbor to the queue with the updated path
    for (const neighborId of neighbors) {
      visited.add(neighborId);
      queue.push([...path, neighborId]);
    }
  }

  // If no path found, return empty array
  return [];
}

function createMergedPath(groups, medialGraph) {
  const mergedPoints = [];
  const visitedNodes = new Set();

  for (let i = 0; i < groups.length; i++) {
    const currentGroup = groups[i];
    const currentPolyline = currentGroup.polylines[0];
    mergedPoints.push(...currentPolyline);

    currentGroup.attributes.scanlineIds.slice(2, -2).forEach((scanLineId) => {
      visitedNodes.add(scanLineId);
    });

    if (i < groups.length - 1) {
      const connectingPath = findPathBetweenNodes(
        groups[i].attributes.scanlineIds.at(-1),
        groups[i + 1].attributes.scanlineIds.at(0),
        visitedNodes,
        medialGraph
      );

      if (connectingPath.length > 0) {
        mergedPoints.push(...connectingPath);
      }
    }
  }

  return {
    polylines: [mergedPoints],
    attributes: {
      stroke: "black",
      strokeWidth: 2,
    },
  };
}

function isPolygonClosed(polygon) {
  if (polygon.length < 3) return false;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  const margin = 0.1;
  const dx = first[0] - last[0];
  const dy = first[1] - last[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < margin;
}

function rasterizePolygonWithHoles(polygon, holes, stepSize) {
  let minX = polygon[0][0];
  let maxX = polygon[0][0];
  let minY = polygon[0][1];
  let maxY = polygon[0][1];

  const allPoints = [polygon, ...holes].flat();
  for (const [x, y] of allPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const scanLines = [];
  for (let scanY = minY; scanY <= maxY; scanY += stepSize) {
    const outerIntersections = findHorizontalIntersections(polygon, scanY);
    const holeIntersections = holes.flatMap((hole) =>
      findHorizontalIntersections(hole, scanY)
    );
    const allIntersections = [...outerIntersections, ...holeIntersections].sort(
      (a, b) => a - b
    );
    for (let i = 0; i < allIntersections.length - 1; i += 2) {
      const x1 = allIntersections[i];
      const x2 = allIntersections[i + 1];
      scanLines.push({
        id: createRandStr(),
        points: [
          [x1, scanY],
          [x2, scanY],
        ],
      });
    }
  }
  return scanLines;
}

function findHorizontalIntersections(polygon, scanY) {
  const xs = [];
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];
    const y1 = p1[1];
    const y2 = p2[1];
    const x1 = p1[0];
    const x2 = p2[0];
    const minEdgeY = Math.min(y1, y2);
    const maxEdgeY = Math.max(y1, y2);
    if (scanY > minEdgeY && scanY <= maxEdgeY && y1 !== y2) {
      const t = (scanY - y1) / (y2 - y1);
      const intersectX = x1 + t * (x2 - x1);
      xs.push(intersectX);
    }
  }
  return xs;
}

function rotatePoint(point, center, angleDegrees) {
  const [x, y] = point;
  const [cx, cy] = center;
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  return [rotatedX + cx, rotatedY + cy];
}

function groupScanLines(scanLines, stepSize) {
  const sortedLines = [...scanLines].sort(
    (a, b) => a.points[0][1] - b.points[0][1]
  );
  const groups = [];
  const processedLines = new Set();

  while (processedLines.size < sortedLines.length) {
    const currentGroup = [];
    let currentLineIndex = findLowestUnprocessedLine(
      sortedLines,
      processedLines
    );
    if (currentLineIndex === -1) break;
    let currentLine = sortedLines[currentLineIndex];
    currentGroup.push(currentLine);
    processedLines.add(currentLineIndex);
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
    if (!processedLines.has(i)) return i;
  }
  return -1;
}

function findNextValidLine(sortedLines, currentLine, processedLines, stepSize) {
  const currentY = currentLine.points[0][1];
  for (let i = 0; i < sortedLines.length; i++) {
    if (processedLines.has(i)) continue;
    const line = sortedLines[i];
    if (line.points[0][1] <= currentY) continue;
    if (
      hasValidVerticalPath(
        currentLine,
        line,
        sortedLines,
        processedLines,
        stepSize
      )
    )
      return i;
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
  const x1Min = Math.min(...line1.points.map((p) => p[0]));
  const x1Max = Math.max(...line1.points.map((p) => p[0]));
  const x2Min = Math.min(...line2.points.map((p) => p[0]));
  const x2Max = Math.max(...line2.points.map((p) => p[0]));
  if (x1Max < x2Min || x2Max < x1Min) return false;
  if (Math.abs(line1.points[0][1] - line2.points[0][1]) > stepSize * 1.3)
    return false;
  const overlapMinX = Math.max(x1Min, x2Min);
  const overlapMaxX = Math.min(x1Max, x2Max);
  for (let i = 0; i < allLines.length; i++) {
    if (!processedLines.has(i)) continue;
    const line = allLines[i];
    const lineY = line.points[0][1];
    if (
      lineY <= Math.min(line1.points[0][1], line2.points[0][1]) ||
      lineY >= Math.max(line1.points[0][1], line2.points[0][1])
    )
      continue;
    const lineXMin = Math.min(...line.points.map((p) => p[0]));
    const lineXMax = Math.max(...line.points.map((p) => p[0]));
    const lineOverlapSize =
      Math.min(lineXMax, overlapMaxX) - Math.max(lineXMin, overlapMinX);
    if (lineOverlapSize > stepSize) return false;
  }
  return true;
}

function makeMedialLineGraph(scanLines, stepSize) {
  const nodes = [];
  const nodeMap = {};
  const edges = [];
  const polylines = [];

  scanLines.forEach((scanLine) => {
    const points = scanLine.points;
    const x1 = points[0][0];
    const y1 = points[0][1];
    const x2 = points[points.length - 1][0];
    const midX = (x1 + x2) / 2;
    const midY = y1;
    nodes.push({ id: scanLine.id, point: [midX, midY] });
    nodeMap[scanLine.id] = [midX, midY];
  });

  for (let i = 0; i < scanLines.length; i++) {
    const currentLine = scanLines[i];
    const currentY = currentLine.points[0][1];
    const currentXMin = Math.min(...currentLine.points.map((p) => p[0]));
    const currentXMax = Math.max(...currentLine.points.map((p) => p[0]));

    for (let j = 0; j < scanLines.length; j++) {
      if (i === j) continue;
      const nextLine = scanLines[j];
      const nextY = nextLine.points[0][1];
      if (nextY <= currentY) continue;
      const yDiff = nextY - currentY;
      if (Math.abs(yDiff - stepSize) > stepSize * 0.3) continue;
      const nextXMin = Math.min(...nextLine.points.map((p) => p[0]));
      const nextXMax = Math.max(...nextLine.points.map((p) => p[0]));
      const overlapSize =
        Math.min(currentXMax, nextXMax) - Math.max(currentXMin, nextXMin);
      if (overlapSize > stepSize) {
        edges.push([nodes[i].id, nodes[j].id]);
        polylines.push([nodes[i].point, nodes[j].point]);
      }
    }
  }

  return {
    nodes,
    edges,
    polylines: {
      polylines,
      attributes: {
        stroke: "black",
      },
    },
  };
}
