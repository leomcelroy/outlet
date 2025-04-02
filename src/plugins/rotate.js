import { createRandStr } from "../utils/createRandStr.js";

const type = "rotate";
const name = "Rotate";

export const rotate = {
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
          id: "angle",
          type: "number",
          value: options.angle || 0,
          min: -360,
          max: 360,
          step: 1,
        },
        {
          id: "originX",
          type: "select",
          value: options.originX || "center",
          options: [
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ],
        },
        {
          id: "originY",
          type: "select",
          value: options.originY || "center",
          options: [
            { value: "top", label: "Top" },
            { value: "center", label: "Center" },
            { value: "bottom", label: "Bottom" },
          ],
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { angle, originX, originY } = controls;
    const radians = (angle * Math.PI) / 180;

    // Calculate bounds of all paths
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    inputGeometry.forEach((child) => {
      child.polylines.forEach((polyline) => {
        polyline.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      });
    });

    // Calculate origin point
    let originXValue = 0;
    let originYValue = 0;

    switch (originX) {
      case "left":
        originXValue = minX;
        break;
      case "center":
        originXValue = (minX + maxX) / 2;
        break;
      case "right":
        originXValue = maxX;
        break;
    }

    switch (originY) {
      case "top":
        originYValue = minY;
        break;
      case "center":
        originYValue = (minY + maxY) / 2;
        break;
      case "bottom":
        originYValue = maxY;
        break;
    }

    // Process paths and rotate their data values
    return inputGeometry.map((child) => ({
      polylines: child.polylines.map((polyline) =>
        polyline.map(([x, y]) => {
          // Translate to origin
          const dx = x - originXValue;
          const dy = y - originYValue;

          // Rotate
          const rotatedX = dx * Math.cos(radians) - dy * Math.sin(radians);
          const rotatedY = dx * Math.sin(radians) + dy * Math.cos(radians);

          // Translate back
          return [rotatedX + originXValue, rotatedY + originYValue];
        })
      ),
      attributes: child.attributes,
    }));
  },
};
