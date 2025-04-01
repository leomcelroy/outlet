import { createRandStr } from "../utils/createRandStr.js";

const type = "scale";
const name = "Scale";

export const scale = {
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
          id: "scale",
          type: "number",
          value: options.scale || 1,
          min: 0.1,
          max: 10,
          step: 0.1,
        },
      ],
    };
  },
  process(controls, children) {
    const { scale } = controls;
    // Process paths and scale their data values
    return children.flat().map((path) => ({
      ...path,
      data: path.data.map((cmd) => ({
        ...cmd,
        ...(cmd.x !== undefined ? { x: cmd.x * scale } : {}),
        ...(cmd.y !== undefined ? { y: cmd.y * scale } : {}),
      })),
    }));
  },
};
