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
      enabled: true,
      controls: [
        {
          id: "offset",
          type: "number",
          value: 100,
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { offset } = controls;

    // Create duplicates of paths with offset
    return [
      ...inputGeometry,
      ...inputGeometry.map((path) => ({
        polylines: path.polylines.map((polyline) =>
          polyline.map(([x, y]) => [x + offset, y + offset])
        ),
        attributes: path.attributes,
      })),
    ];
  },
};
