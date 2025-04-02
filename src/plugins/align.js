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
  process(controls, inputGeometry) {
    const { horizontal, vertical } = controls;

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
    return inputGeometry.map((path) => {
      // Calculate path bounds
      let pathMinX = Infinity,
        pathMaxX = -Infinity;
      let pathMinY = Infinity,
        pathMaxY = -Infinity;

      path.polylines.forEach((polyline) => {
        polyline.forEach(([x, y]) => {
          pathMinX = Math.min(pathMinX, x);
          pathMaxX = Math.max(pathMaxX, x);
          pathMinY = Math.min(pathMinY, y);
          pathMaxY = Math.max(pathMaxY, y);
        });
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

      // Apply offsets to polylines
      return {
        polylines: path.polylines.map((polyline) =>
          polyline.map(([x, y]) => [x + offsetX, y + offsetY])
        ),
        attributes: path.attributes,
      };
    });
  },
};
