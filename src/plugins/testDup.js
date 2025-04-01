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
          ...(cmd.x !== undefined ? { x: cmd.x + offset } : {}),
          ...(cmd.y !== undefined ? { y: cmd.y + offset } : {}),
        })),
      })),
    ];
  },
};
