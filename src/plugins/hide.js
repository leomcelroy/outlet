import { createRandStr } from "../utils/createRandStr.js";

const type = "hide";
const name = "Hide";

export const hide = {
  type,
  name,
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      enabled: true,
      type: "hide",
      controls: [],
    };
  },
  process(controls, inputGeometry) {
    // Only process paths, apply fill to path attributes
    return [];
  },
};
