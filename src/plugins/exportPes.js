import { createRandStr } from "../utils/createRandStr.js";

const type = "exportPes";
const name = "Export PES";

export const exportPes = {
  type,
  name,
  applyOnce: true,
  init(defaults = {}) {
    return {
      id: createRandStr(),
      type,
      name,
      controls: [],
    };
  },
  // children as array of array of geometries
  process(controls, children, attributes) {
    console.log("Export PES");
    console.log({ controls, children, attributes });
  },
};
