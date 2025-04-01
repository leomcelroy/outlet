import { createRandStr } from "../utils/createRandStr.js";

const type = "raster";
const name = "Raster";

export const raster = {
  type,
  name,
  init() {
    return {
      id: createRandStr(),
      name,
      type,
      controls: [
        {
          id: "density",
          type: "number",
          label: "Density",
          value: 1,
        },
      ],
    };
  },
  process(controls, children) {
    const { density } = controls;

    const all = children.flat();

    children.forEach((child) => {
      console.log({ density, child });
    });

    return all;
  },
};
