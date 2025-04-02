import { createRandStr } from "../utils/createRandStr.js";

const type = "example";
const name = "example";

export const example = {
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
          id: "color",
          type: "color",
          value: options.color || "black",
        },
        {
          id: "string",
          type: "string",
          value: "hello",
        },
        {
          id: "number",
          type: "number",
          value: 42,
        },
        {
          id: "slider",
          type: "slider",
          value: 50,
          min: 0,
          max: 100,
        },
        {
          id: "select",
          type: "select",
          value: "option1",
          options: ["option1", "option2", "option3"],
        },
        {
          id: "boolean",
          type: "boolean",
          value: true,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { color } = controls;
    // Only process paths, apply stroke to path attributes
    return inputGeometry.map((path) => ({
      polylines: path.polylines,
      attributes: {
        ...path.attributes,
        stroke: color,
      },
    }));
  },
};
