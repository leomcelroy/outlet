import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolylines } from "../utils/convertPathToPolylines.js";

const type = "rasterPath";
const name = "Raster Path";

export const rasterPath = {
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
          id: "thickness",
          type: "number",
          label: "Thickness",
          value: 1,
        },
        {
          id: "spacing",
          type: "number",
          label: "Spacing",
          value: 10,
        },
      ],
    };
  },
  process(controls, children) {
    const { thickness, spacing } = controls;

    if (thickness < 0.5) {
      thickness = 0.5;
    }
    if (spacing < 0.5) {
      spacing = 0.5;
    }

    // Create a map to store paths by ID
    const pathsByID = new Map();

    for (const path of children.flat()) {
      const polylines = convertPathToPolylines(path.data);

      for (const polyline of polylines) {
        const pathData = [];
        const perpendicularPoints = [];

        // First pass: create perpendicular lines along the path
        for (let i = 0; i < polyline.length - 1; i++) {
          const currentPoint = polyline[i];
          const nextPoint = polyline[i + 1];

          const segDx = nextPoint[0] - currentPoint[0];
          const segDy = nextPoint[1] - currentPoint[1];
          const length = Math.sqrt(segDx * segDx + segDy * segDy);

          // Calculate perpendicular vector
          const perpX = -segDy / length;
          const perpY = segDx / length;

          // Calculate number of segments based on length and spacing
          const numSegments = Math.max(1, Math.floor(length / spacing));

          // Add points for perpendicular line
          for (let j = 0; j <= numSegments; j++) {
            const t = j / numSegments;
            const x = currentPoint[0] + segDx * t;
            const y = currentPoint[1] + segDy * t;

            perpendicularPoints.push({
              x: x + perpX * thickness,
              y: y + perpY * thickness,
            });
            perpendicularPoints.push({
              x: x - perpX * thickness,
              y: y - perpY * thickness,
            });
          }
        }

        // Handle the last point
        const lastPoint = polyline[polyline.length - 1];
        const lastPrevPoint = polyline[polyline.length - 2];
        const lastSegDx = lastPoint[0] - lastPrevPoint[0];
        const lastSegDy = lastPoint[1] - lastPrevPoint[1];
        const lastLength = Math.sqrt(
          lastSegDx * lastSegDx + lastSegDy * lastSegDy
        );
        const lastPerpX = -lastSegDy / lastLength;
        const lastPerpY = lastSegDx / lastLength;
        perpendicularPoints.push({
          x: lastPoint[0] + lastPerpX * thickness,
          y: lastPoint[1] + lastPerpY * thickness,
        });
        perpendicularPoints.push({
          x: lastPoint[0] - lastPerpX * thickness,
          y: lastPoint[1] - lastPerpY * thickness,
        });

        // Second pass: create the zigzag path by connecting alternating points
        if (perpendicularPoints.length > 0) {
          // Start with the first point
          pathData.push({
            x: perpendicularPoints[0].x,
            y: perpendicularPoints[0].y,
            cmd: "move",
          });

          // Connect points alternately
          for (let i = 1; i < perpendicularPoints.length; i++) {
            const point = perpendicularPoints[i];
            pathData.push({
              x: point.x,
              y: point.y,
              cmd: "line",
            });
          }
        }

        // If we already have data for this ID, append to it
        if (pathsByID.has(path.id)) {
          const existingData = pathsByID.get(path.id);
          // Add a move command to start the new segment
          pathData[0].cmd = "move";
          pathsByID.set(path.id, [...existingData, ...pathData]);
        } else {
          pathsByID.set(path.id, pathData);
        }
      }
    }

    // Convert the map back to an array of paths
    return Array.from(pathsByID.entries()).map(([id, data]) => ({
      type: "path",
      id,
      data,
      attributes: {},
    }));
  },
};
