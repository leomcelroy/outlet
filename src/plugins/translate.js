import { createRandStr } from "../utils/createRandStr.js";

const type = "translate";
const name = "Translate";

export const translate = {
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
          id: "x",
          type: "number",
          value: options.x || 0,
          min: -1000,
          max: 1000,
          step: 1,
        },
        {
          id: "y",
          type: "number",
          value: options.y || 0,
          min: -1000,
          max: 1000,
          step: 1,
        },
        {
          id: "originX",
          type: "select",
          value: options.originX || "zero",
          options: [
            { value: "zero", label: "Zero" },
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ],
        },
        {
          id: "originY",
          type: "select",
          value: options.originY || "zero",
          options: [
            { value: "zero", label: "Zero" },
            { value: "top", label: "Top" },
            { value: "center", label: "Center" },
            { value: "bottom", label: "Bottom" },
          ],
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { x, y, originX, originY } = controls;

    // Calculate bounds of all paths
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    inputGeometry.forEach((path) => {
      path.polylines.forEach((polyline) => {
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
      case "zero":
        originXValue = 0;
        break;
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
      case "zero":
        originYValue = 0;
        break;
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

    // Process paths and translate their data values
    return inputGeometry.map((path) => ({
      polylines: path.polylines.map((polyline) =>
        polyline.map(([ox, oy]) => [
          ox - originXValue + x,
          oy - originYValue + y,
        ])
      ),
      attributes: path.attributes,
    }));
  },
};
