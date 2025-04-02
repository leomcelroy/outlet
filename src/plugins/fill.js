import { createRandStr } from "../utils/createRandStr.js";

const type = "fill";
const name = "Fill";

export const fill = {
  type,
  name,
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type: "fill",
      enabled: true,
      controls: [
        {
          id: "color",
          type: "color",
          value: options.color || "none",
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { color } = controls;
    // Only process paths, apply fill to path attributes
    return inputGeometry.map((path) => ({
      polylines: path.polylines,
      attributes: {
        ...path.attributes,
        fill: color,
      },
    }));
  },
};
