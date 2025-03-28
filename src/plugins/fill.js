import { createRandStr } from "../utils/createRandStr.js";

const type = "fill";
const name = "Fill";

export const fill = {
  type,
  name,
  init(defaults = {}) {
    const color = defaults.color ?? "black";
    return {
      id: createRandStr(),
      type,
      name,
      controls: [
        {
          id: "color",
          type: "color",
          value: color,
        },
      ],
    };
  },
  // children as array of array of geometries
  process(controls, children, attributes) {
    const { color } = controls;
    attributes.fill = color;
    return children.flat();
  },
};
