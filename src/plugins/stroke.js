import { createRandStr } from "../utils/createRandStr.js";

export const stroke = {
  type: "stroke",
  name: "Stroke",
  init(options = {}) {
    return {
      type: "stroke",
      controls: [
        {
          id: "color",
          type: "color",
          value: color,
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
  process(controls, children) {
    const { color } = controls;
    // Only process paths, apply stroke to path attributes
    return children.flat().map((path) => ({
      ...path,
      attributes: {
        ...path.attributes,
        stroke: color,
      },
    }));
  },
};
