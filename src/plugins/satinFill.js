import { createRandStr } from "../utils/createRandStr.js";

const type = "satinFill";
const name = "Satin Fill";

export const satinFill = {
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
          // Satin fill the polygon
          const stitchPolyline = satinFillPolygon(
            polyline.slice(0, polyline.length - 1)
          );

          // If we already have data for this ID, append to it
          if (pathsByID.has(child.id)) {
            const existingPolylines = pathsByID.get(child.id);
            pathsByID.set(child.id, [...existingPolylines, stitchPolyline]);
          } else {
            pathsByID.set(child.id, [stitchPolyline]);
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

function calculateSlope(x0, y0, x1, y1) {
  if (x1 - x0 === 0) return Infinity;
  return (y1 - y0) / (x1 - x0);
}

function initializeEdges(polygon) {
  const edges = [];
  const numVertices = polygon.length;

  for (let i = 0; i < numVertices; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % numVertices];
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    const xAtMinY = y0 <= y1 ? x0 : x1;
    const slope = calculateSlope(x0, y0, x1, y1);
    edges.push({ minY, maxY, xAtMinY, slope });
  }

  return edges;
}

function initializeGlobalEdgeTable(edges) {
  // Sort edges by minY, then by xAtMinY if minY is equal
  let globalEdgeTable = edges
    .sort((a, b) =>
      a.minY === b.minY ? a.xAtMinY - b.xAtMinY : a.minY - b.minY
    )
    // Filter out horizontal edges (slope = 0)
    .filter((edge) => edge.slope !== 0);

  return globalEdgeTable;
}

function addEdgesToActiveEdgeTable(globalEdgeTable, activeEdgeTable, scanline) {
  // Add new edges from global edge table to active edge table
  while (globalEdgeTable.length > 0 && globalEdgeTable[0].minY === scanline) {
    const { maxY, xAtMinY, slope } = globalEdgeTable[0];
    activeEdgeTable.push({
      maxY, // maxY
      currentX: xAtMinY, // x at minY
      dx: 1 / slope, // inverse slope
    });
    globalEdgeTable.shift();
  }

  activeEdgeTable.sort((a, b) => a.currentX - b.currentX);
}

function satinFillPolygon(polygon) {
  const edges = initializeEdges(polygon);
  const globalEdgeTable = initializeGlobalEdgeTable(edges);

  let scanLine = Math.min(...edges.map((edge) => edge.minY)); // find the starting y value
  let activeEdgeTable = [];
  addEdgesToActiveEdgeTable(globalEdgeTable, activeEdgeTable, scanLine);

  const stitchRegions = [];

  // Iterate over each scan-line until active edge table is empty
  while (activeEdgeTable.length > 0) {
    if (activeEdgeTable.length % 2 === 0) {
      const numPairs = activeEdgeTable.length / 2;

      if (
        stitchRegions.length === 0 ||
        numPairs !== stitchRegions.at(-1).length
      ) {
        //Push a new region
        stitchRegions.push(
          Array(numPairs)
            .fill()
            .map(() => [])
        );
      }

      for (let i = 0; i < activeEdgeTable.length; i += 2) {
        const xStart = activeEdgeTable[i].currentX;
        const xEnd = activeEdgeTable[i + 1].currentX;

        stitchRegions.at(-1)[i / 2].push([xStart, scanLine]);
        stitchRegions.at(-1)[i / 2].push([xEnd, scanLine]);
      }
    } else {
      console.warn("ODD NUMBER OF EDGES at scanline", scanLine);
    }

    // increment scan line
    scanLine++;

    // Remove edges that end before current scan line
    activeEdgeTable = activeEdgeTable.filter((edge) => edge.maxY > scanLine);

    // Update x-coordinates using inverse slope
    activeEdgeTable = activeEdgeTable.map(({ maxY, currentX, dx }) => ({
      maxY,
      currentX: currentX + dx,
      dx,
    }));

    addEdgesToActiveEdgeTable(globalEdgeTable, activeEdgeTable, scanLine);
  }

  console.log("STITCH REGIONS", stitchRegions);
  return stitchRegions.flat(2);
}
