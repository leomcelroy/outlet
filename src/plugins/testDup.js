import { createRandStr } from "../utils/createRandStr.js";

const type = "testDup";
const name = "Test Dup";

export const testDup = {
  type,
  name,
  init(defaults = {}) {
    const offset = defaults.offset ?? 10;
    return {
      id: createRandStr(),
      type,
      name,
      controls: [
        {
          id: "xOffset",
          type: "number",
          value: offset,
        },
        {
          id: "yOffset",
          type: "number",
          value: offset,
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
    const { xOffset, yOffset } = controls;
    const newChildren = [];

    children.forEach((child) =>
      child.forEach((c) => {
        switch (c.type) {
          case "point":
            newChildren.push(c);
            newChildren.push({ ...c, x: c.x + xOffset, y: c.y + yOffset });
            break;
          case "line":
            newChildren.push(c);
            newChildren.push({
              ...c,
              x1: c.x1 + xOffset,
              y1: c.y1 + yOffset,
              x2: c.x2 + xOffset,
              y2: c.y2 + yOffset,
            });
            break;
        }
      })
    );

    return newChildren;
  },
};
