import { createRandStr } from "../utils/createRandStr.js";

const type = "stroke";
const name = "Stroke";

export const stroke = {
  type,
  name,
  init(defaults = {}) {
    const color = defaults.color ?? "black";

    return {
      id: createRandStr(),
      type,
      name,
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
  // children as array of array of geometries
  process(controls, children, attributes) {
    const { color } = controls;
    attributes.stroke = color;
    return children;
  },
};
