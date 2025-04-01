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
  process(controls, children) {
    const { angle, originX, originY } = controls;
    const radians = (angle * Math.PI) / 180;

    // Calculate bounds of all paths
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    children.flat().forEach((path) => {
      path.data.forEach((cmd) => {
        if (cmd.x !== undefined) {
          minX = Math.min(minX, cmd.x);
          maxX = Math.max(maxX, cmd.x);
        }
        if (cmd.y !== undefined) {
          minY = Math.min(minY, cmd.y);
          maxY = Math.max(maxY, cmd.y);
        }
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
    return children.flat().map((path) => ({
      ...path,
      data: path.data.map((cmd) => {
        if (cmd.x === undefined || cmd.y === undefined) return cmd;

        // Translate to origin
        const x = cmd.x - originXValue;
        const y = cmd.y - originYValue;

        // Rotate
        const rotatedX = x * Math.cos(radians) - y * Math.sin(radians);
        const rotatedY = x * Math.sin(radians) + y * Math.cos(radians);

        // Translate back
        return {
          ...cmd,
          x: rotatedX + originXValue,
          y: rotatedY + originYValue,
        };
      }),
    }));
  },
};
