import { createRandStr } from "../utils/createRandStr.js";

export const fill = {
  type: "fill",
  init(defaults = {}) {
    const color = defaults.color ?? "black";
    return {
      id: createRandStr(),
      type: "fill",
      // type: "fill",
      name: "Fill",
      controls: [
        {
          id: "color",
          type: "color",
          value: color,
        },
        // strings
        // numbers
        // slider (range)
        // color
        // select (dropdown)
        // boolean (checkbox)
      ],
    };
  },
  // children as array of array of geometries
  process(controls, children, attributes) {
    const { color } = controls;
    attributes.fill = color;
  },
};
