import { createRandStr } from "../utils/createRandStr.js";

const type = "testDup";
const name = "Test Duplicate";

export const testDup = {
  type,
  name,
  init() {
    return {
      id: createRandStr(),
      name,
      type,
      controls: [
        {
          id: "offset",
          type: "number",
          value: 100,
        },
      ],
    };
  },
  process(controls, children) {
    const { offset } = controls;
    const paths = children.flat();

    // Create duplicates of paths with offset
    return [
      ...paths,
      ...paths.map((path) => ({
        ...path,
        data: path.data.map((cmd) => ({
          ...cmd,
          x: cmd.x + offset,
          y: cmd.y + offset,
        })),
        id: path.id, // New ID for duplicate
      })),
    ];
  },
};
