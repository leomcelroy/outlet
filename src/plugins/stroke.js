import { createRandStr } from "../utils/createRandStr.js";

export const stroke = {
  type: "stroke",
  init(defaults = {}) {
    const color = defaults.color ?? "black";

    return {
      id: createRandStr(),
      type: "stroke",
      name: "Stroke",
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
    attributes.stroke = color;
    return children.flat();
  },
};
