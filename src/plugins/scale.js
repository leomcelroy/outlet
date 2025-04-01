import { createRandStr } from "../utils/createRandStr.js";

const type = "scale";
const name = "Scale";

export const scale = {
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
          id: "scale",
          type: "number",
          value: options.scale || 1,
          min: 0.1,
          max: 10,
          step: 0.1,
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
    const { scale, originX, originY } = controls;

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

    // Process paths and scale their data values
    return children.flat().map((path) => ({
      ...path,
      data: path.data.map((cmd) => ({
        ...cmd,
        ...(cmd.x !== undefined
          ? { x: originXValue + (cmd.x - originXValue) * scale }
          : {}),
        ...(cmd.y !== undefined
          ? { y: originYValue + (cmd.y - originYValue) * scale }
          : {}),
      })),
    }));
  },
};
