import { createRandStr } from "../utils/createRandStr.js";

const type = "scaleToRect";
const name = "Scale to Rectangle";

export const scaleToRect = {
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
          id: "width",
          type: "number",
          value: options.width || 100,
          label: "Width",
          min: 1,
        },
        {
          id: "height",
          type: "number",
          value: options.height || 100,
          label: "Height",
          min: 1,
        },
        {
          id: "border",
          type: "number",
          value: options.border || 5,
          label: "Border",
          min: 0,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { width, height, border } = controls;

    // Calculate the effective dimensions after border
    const effectiveWidth = width - 2 * border;
    const effectiveHeight = height - 2 * border;

    // Find the bounding box of the input geometry
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    inputGeometry.forEach((geometry) => {
      geometry.polylines.forEach((polyline) => {
        polyline.forEach((point) => {
          minX = Math.min(minX, point[0]);
          maxX = Math.max(maxX, point[0]);
          minY = Math.min(minY, point[1]);
          maxY = Math.max(maxY, point[1]);
        });
      });
    });

    // Calculate current dimensions and center
    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate scale factors
    const scaleX = effectiveWidth / currentWidth;
    const scaleY = effectiveHeight / currentHeight;
    const scale = Math.min(scaleX, scaleY);

    // Transform the geometry
    return inputGeometry.map((geometry) => ({
      polylines: geometry.polylines.map((polyline) =>
        polyline.map((point) => {
          // Scale relative to center without moving
          const scaledX = centerX + (point[0] - centerX) * scale;
          const scaledY = centerY + (point[1] - centerY) * scale;

          return [scaledX, scaledY];
        })
      ),
      attributes: geometry.attributes,
    }));
  },
};
