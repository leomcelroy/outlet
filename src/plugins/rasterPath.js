import { createRandStr } from "../utils/createRandStr.js";
import { resamplePolylines } from "../utils/polylines/resamplePolylines.js";

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
  process(controls, inputGeometry) {
    const { thickness, spacing } = controls;

    if (thickness < 0.5) {
      thickness = 0.5;
    }
    if (spacing < 0.5) {
      spacing = 0.5;
    }

    // Create a map to store paths by ID
    const pathsByID = new Map();

    for (const child of inputGeometry) {
      const resampled = resamplePolylines(child.polylines, spacing);
      for (const polyline of resampled) {
        // Skip empty polylines
        if (!polyline || polyline.length === 0) continue;

        const perpendicularPoints = [];

        // Handle single point case
        if (polyline.length === 1) {
          const [x, y] = polyline[0];
          // For a single point, create a small horizontal line
          perpendicularPoints.push([x - thickness, y]);
          perpendicularPoints.push([x + thickness, y]);
        } else {
          // First pass: create perpendicular lines along the path
          for (let i = 0; i < polyline.length - 1; i++) {
            const [x1, y1] = polyline[i];
            const [x2, y2] = polyline[i + 1];

            const segDx = x2 - x1;
            const segDy = y2 - y1;
            const length = Math.sqrt(segDx * segDx + segDy * segDy);

            // Calculate perpendicular vector
            const perpX = -segDy / length;
            const perpY = segDx / length;

            // Calculate number of segments based on length and spacing
            const numSegments = Math.max(1, Math.floor(length / spacing));

            // Add points for perpendicular line
            for (let j = 0; j <= numSegments; j++) {
              const t = j / numSegments;
              const x = x1 + segDx * t;
              const y = y1 + segDy * t;

              perpendicularPoints.push([
                x + perpX * thickness,
                y + perpY * thickness,
              ]);
              perpendicularPoints.push([
                x - perpX * thickness,
                y - perpY * thickness,
              ]);
            }
          }

          // Handle the last point
          const [lastX, lastY] = polyline[polyline.length - 1];
          const [lastPrevX, lastPrevY] = polyline[polyline.length - 2];
          const lastSegDx = lastX - lastPrevX;
          const lastSegDy = lastY - lastPrevY;
          const lastLength = Math.sqrt(
            lastSegDx * lastSegDx + lastSegDy * lastSegDy
          );
          const lastPerpX = -lastSegDy / lastLength;
          const lastPerpY = lastSegDx / lastLength;
          perpendicularPoints.push([
            lastX + lastPerpX * thickness,
            lastY + lastPerpY * thickness,
          ]);
          perpendicularPoints.push([
            lastX - lastPerpX * thickness,
            lastY - lastPerpY * thickness,
          ]);
        }

        // Second pass: create the zigzag path by connecting points
        if (perpendicularPoints.length > 0) {
          // If we already have data for this ID, append to it
          if (pathsByID.has(child.id)) {
            const existingPolylines = pathsByID.get(child.id);
            pathsByID.set(child.id, [
              ...existingPolylines,
              perpendicularPoints,
            ]);
          } else {
            pathsByID.set(child.id, [perpendicularPoints]);
          }
        }
      }
    }

    // Convert the map back to an array of paths
    return Array.from(pathsByID.entries()).map(([id, polylines]) => ({
      id,
      polylines,
      attributes: {},
    }));
  },
};
