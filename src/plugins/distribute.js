import { createRandStr } from "../utils/createRandStr.js";

const type = "distribute";
const name = "Distribute";

export const distribute = {
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
          id: "direction",
          type: "select",
          value: options.direction || "horizontal",
          options: [
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ],
        },
        {
          id: "mode",
          type: "select",
          value: options.mode || "spacing",
          options: [
            { value: "spacing", label: "Spacing" },
            { value: "dimension", label: "Overall Dimension" },
          ],
        },
        {
          id: "value",
          type: "number",
          value: options.value || 0,
          min: 0,
          max: 1000,
          step: 1,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { direction, mode, value } = controls;
    const paths = inputGeometry;

    // Calculate bounds of all paths
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    paths.forEach((child) => {
      child.polylines.forEach((polyline) => {
        polyline.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      });
    });

    // Calculate path bounds and centers
    const pathBounds = paths.map((path) => {
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

      return {
        minX: pathMinX,
        maxX: pathMaxX,
        minY: pathMinY,
        maxY: pathMaxY,
        centerX: (pathMinX + pathMaxX) / 2,
        centerY: (pathMinY + pathMaxY) / 2,
        width: pathMaxX - pathMinX,
        height: pathMaxY - pathMinY,
      };
    });

    // Sort paths based on direction
    const sortedPaths = [...paths].sort((a, b) => {
      const aIndex = paths.indexOf(a);
      const bIndex = paths.indexOf(b);
      const aBounds = pathBounds[aIndex];
      const bBounds = pathBounds[bIndex];

      if (direction === "horizontal") {
        return aBounds.centerX - bBounds.centerX;
      } else {
        return aBounds.centerY - bBounds.centerY;
      }
    });

    // Calculate distribution parameters
    let start, end, totalSpace;
    if (direction === "horizontal") {
      start = Math.min(...pathBounds.map((b) => b.minX));
      end = Math.max(...pathBounds.map((b) => b.maxX));
      totalSpace = end - start;
    } else {
      start = Math.min(...pathBounds.map((b) => b.minY));
      end = Math.max(...pathBounds.map((b) => b.maxY));
      totalSpace = end - start;
    }

    // Calculate spacing between elements
    let spacing;
    if (mode === "spacing") {
      spacing = value;
    } else {
      // In dimension mode, calculate spacing to fit elements within the specified dimension
      const totalElementWidth = pathBounds.reduce(
        (sum, bounds) =>
          sum + (direction === "horizontal" ? bounds.width : bounds.height),
        0
      );
      spacing = (value - totalElementWidth) / (paths.length - 1);
    }

    // Distribute paths
    return sortedPaths.map((path, index) => {
      const bounds = pathBounds[paths.indexOf(path)];
      let offsetX = 0;
      let offsetY = 0;

      if (index > 0) {
        const prevBounds = pathBounds[paths.indexOf(sortedPaths[index - 1])];
        if (direction === "horizontal") {
          const targetX = prevBounds.maxX + spacing;
          offsetX = targetX - bounds.minX;
        } else {
          const targetY = prevBounds.maxY + spacing;
          offsetY = targetY - bounds.minY;
        }
      }

      return {
        polylines: path.polylines.map((polyline) =>
          polyline.map(([x, y]) => [x + offsetX, y + offsetY])
        ),
        attributes: path.attributes,
      };
    });
  },
};
