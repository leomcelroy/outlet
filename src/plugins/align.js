import { createRandStr } from "../utils/createRandStr.js";

const type = "align";
const name = "Align";

export const align = {
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
          id: "horizontal",
          type: "select",
          value: options.horizontal || "none",
          options: [
            { value: "none", label: "None" },
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ],
        },
        {
          id: "vertical",
          type: "select",
          value: options.vertical || "none",
          options: [
            { value: "none", label: "None" },
            { value: "top", label: "Top" },
            { value: "center", label: "Center" },
            { value: "bottom", label: "Bottom" },
          ],
        },
      ],
    };
  },
  process(controls, children) {
    const { horizontal, vertical } = controls;
    const paths = children.flat();

    // Calculate bounds of all paths
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    paths.forEach((path) => {
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

    // Calculate target positions
    let targetX = 0;
    let targetY = 0;

    switch (horizontal) {
      case "left":
        targetX = minX;
        break;
      case "center":
        targetX = (minX + maxX) / 2;
        break;
      case "right":
        targetX = maxX;
        break;
    }

    switch (vertical) {
      case "top":
        targetY = minY;
        break;
      case "center":
        targetY = (minY + maxY) / 2;
        break;
      case "bottom":
        targetY = maxY;
        break;
    }

    // Process each path
    return paths.map((path) => {
      // Calculate path bounds
      let pathMinX = Infinity,
        pathMaxX = -Infinity;
      let pathMinY = Infinity,
        pathMaxY = -Infinity;

      path.data.forEach((cmd) => {
        if (cmd.x !== undefined) {
          pathMinX = Math.min(pathMinX, cmd.x);
          pathMaxX = Math.max(pathMaxX, cmd.x);
        }
        if (cmd.y !== undefined) {
          pathMinY = Math.min(pathMinY, cmd.y);
          pathMaxY = Math.max(pathMaxY, cmd.y);
        }
      });

      // Calculate offsets
      let offsetX = 0;
      let offsetY = 0;

      if (horizontal !== "none") {
        switch (horizontal) {
          case "left":
            offsetX = targetX - pathMinX;
            break;
          case "center":
            offsetX = targetX - (pathMinX + pathMaxX) / 2;
            break;
          case "right":
            offsetX = targetX - pathMaxX;
            break;
        }
      }

      if (vertical !== "none") {
        switch (vertical) {
          case "top":
            offsetY = targetY - pathMinY;
            break;
          case "center":
            offsetY = targetY - (pathMinY + pathMaxY) / 2;
            break;
          case "bottom":
            offsetY = targetY - pathMaxY;
            break;
        }
      }

      // Apply offsets to path data
      return {
        ...path,
        data: path.data.map((cmd) => ({
          ...cmd,
          ...(cmd.x !== undefined ? { x: cmd.x + offsetX } : {}),
          ...(cmd.y !== undefined ? { y: cmd.y + offsetY } : {}),
        })),
      };
    });
  },
};
