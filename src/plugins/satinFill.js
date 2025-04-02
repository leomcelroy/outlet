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
          const stitchPolyline = satinFillPolygon(polyline);

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
    edges.push([minY, maxY, xAtMinY, slope]);
  }

  return edges;
}

function initializeGlobalEdgeTable(edges) {
  // Sort edges by minY, then by xAtMinY if minY is equal
  let globalEdgeTable = edges
    .sort((a, b) => (a[0] === b[0] ? a[2] - b[2] : a[0] - b[0]))
    // Filter out horizontal edges (slope = 0)
    .filter((edge) => edge[3] !== 0);

  return globalEdgeTable;
}

function initializeActiveEdgeTable(globalEdgeTable, scanLine) {
  const activeEdgeTable = [];
  for (const edge of globalEdgeTable) {
    if (edge[0] === scanLine) {
      activeEdgeTable.push([edge[1], edge[2], 1 / edge[3]]);
    } else if (edge[0] > scanLine) {
      break;
    }
  }
  activeEdgeTable.sort((a, b) => a[1] - b[1]);
  return activeEdgeTable;
}

function satinFillPolygon(polygon) {
  const edges = initializeEdges(polygon);
  const globalEdgeTable = initializeGlobalEdgeTable(edges);

  let scanLine = Math.min(...edges.map((edge) => edge[0])); // find the starting y value
  let activeEdgeTable = initializeActiveEdgeTable(globalEdgeTable, scanLine);

  const stitches = [];
  console.log("BEGIN SCANLINE");
  // Iterate over each scan-line until active edge table is empty
  while (activeEdgeTable.length > 0) {
    console.log(activeEdgeTable);
    // Create stitches between x-values of odd and even parity edge pairs
    console.log("FILLING REGIONS", activeEdgeTable.length);

    if (activeEdgeTable.length % 2 === 0) {
      for (let i = 0; i < activeEdgeTable.length; i += 2) {
        const xStart = activeEdgeTable[i][1];
        const xEnd = activeEdgeTable[i + 1][1];

        stitches.push([xStart, scanLine]);
        stitches.push([xEnd, scanLine]);
      }
    }
    // increment scan line
    scanLine++;

    // Remove edges that end at current scan line
    activeEdgeTable = activeEdgeTable.filter((edge) => edge[0] !== scanLine);

    // Update x-coordinates using inverse slope
    activeEdgeTable = activeEdgeTable.map((edge) => [
      edge[0],
      edge[1] + edge[2], // Add inverse slope to x-coordinate
      edge[2],
    ]);

    // Keep only edges that intersect current scan line
    // activeEdgeTable = activeEdgeTable.filter((edge) => edge[0] === scanLine);

    console.log("ADDING NEW EDGES", scanLine);
    console.log(globalEdgeTable);

    // Add new edges from global edge table to active edge table
    while (globalEdgeTable.length > 0 && globalEdgeTable[0][0] === scanLine) {
      activeEdgeTable.push([
        globalEdgeTable[0][1], // maxY
        globalEdgeTable[0][2], // x at minY
        1 / globalEdgeTable[0][3], // inverse slope
      ]);
      globalEdgeTable.shift();
    }

    // Sort active edge table by x-coordinate
    activeEdgeTable.sort((a, b) => a[1] - b[1]);
  }

  console.log("sTITCHES");
  console.log(stitches);
  return stitches;
}
