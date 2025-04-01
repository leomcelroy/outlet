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
      controls: [
        {
          id: "color",
          type: "color",
          value: options.color || "black",
        },
      ],
    };
  },
  process(controls, children) {
    const { color } = controls;
    // Only process paths, apply stroke to path attributes
    return children.flat().map((path) => ({
      ...path,
      attributes: {
        ...path.attributes,
        stroke: color,
      },
    }));
  },
};
