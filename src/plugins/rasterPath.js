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
          value: 0.5,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    let { thickness, spacing } = controls;

    if (thickness < 0.2) {
      thickness = 0.2;
    }
    if (spacing < 0.2) {
      spacing = 0.2;
    }

    // Create a map to store paths by ID
    const allPolylines = [];

    for (const child of inputGeometry) {
      // Create a map to store paths by ID
      for (const polyline of child.polylines) {
        const resampled = resamplePolylines([polyline], spacing)[0];
        const newPolyline = [resampled[0]];

        for (let i = 0; i < resampled.length - 1; i++) {
          const p1 = resampled[i];
          const p2 = resampled[i + 1];

          // Get the perpendicular points
          const perpendicularPoints = getPerpendicularPoints(
            p1,
            p2,
            thickness / 2
          );

          // Add the perpendicular points to the polyline
          newPolyline.push(...perpendicularPoints);
        }

        newPolyline.push(resampled[resampled.length - 1]);

        allPolylines.push({
          polylines: [newPolyline],
          attributes: child.attributes,
        });
      }
    }

    return allPolylines;
  },
};

function getPerpendicularPoints(p1, p2, distance = 1) {
  // Calculate the vector between p1 and p2
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];

  // Calculate the length of the vector
  const length = Math.sqrt(dx * dx + dy * dy);

  // Normalize the vector
  const nx = dx / length;
  const ny = dy / length;

  // Calculate the perpendicular vector (rotate 90 degrees)
  const px = -ny;
  const py = nx;

  // Calculate the midpoint
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;

  // Calculate the two perpendicular points
  const point1 = [mx + px * distance, my + py * distance];

  const point2 = [mx - px * distance, my - py * distance];

  return [point1, point2];
}
