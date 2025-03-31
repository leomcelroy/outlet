const type = "fill";
const name = "Fill";

export const fill = {
  type,
  name,
  init(options = {}) {
    return {
      name,
      type: "fill",
      controls: [
        {
          id: "color",
          type: "color",
          value: options.color || "none",
        },
      ],
    };
  },
  process(controls, children) {
    const { color } = controls;
    // Only process paths, apply fill to path attributes
    return children.flat().map((path) => ({
      ...path,
      attributes: {
        ...path.attributes,
        fill: color,
      },
    }));
  },
};
