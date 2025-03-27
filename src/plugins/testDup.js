import { createRandStr } from "../utils/createRandStr.js";

export const testDup = {
  type: "testDup",
  init(defaults = {}) {
    return {
      id: createRandStr(),
      type: "testDup",
      name: "Test Dup",
      controls: [
        {
          id: "offset",
          type: "number",
          value: 0,
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
    const { offset } = controls;
    const newChildren = [];
    console.log();
    children.forEach((child) => {
      newChildren.push(child);
      newChildren.push(child);
    });
    return newChildren.flat();
  },
};
