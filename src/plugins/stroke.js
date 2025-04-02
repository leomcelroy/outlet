import { createRandStr } from "../utils/createRandStr.js";

const type = "stroke";
const name = "Stroke";

export const stroke = {
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
          id: "color",
          type: "color",
          value: options.color || "black",
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { color, width } = controls;
    return inputGeometry.map((child) => ({
      polylines: child.polylines,
      attributes: {
        ...child.attributes,
        stroke: color,
        strokeWidth: width,
      },
    }));
  },
};
