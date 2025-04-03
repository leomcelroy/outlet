import { createRandStr } from "../utils/createRandStr.js";

const type = "colorCode";
const name = "Color Code";

// Define six distinct colors for the palette
const colorPalette = [
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#00FF00" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
];

export const colorCode = {
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
          type: "select",
          value: options.color || colorPalette[0].value,
          options: colorPalette.map((color) => ({
            label: color.name,
            value: color.value,
          })),
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { color } = controls;
    return inputGeometry.map((child) => ({
      polylines: child.polylines,
      attributes: {
        ...child.attributes,
        stroke: color,
      },
    }));
  },
};
