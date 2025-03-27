export const stroke = {
  id: "stroke",
  init(defaults) {
    const color = defaults.color ?? "black";

    return {
      id: "stroke",
      name: "Stroke",
      controls: [
        {
          id: "color", 
          type: "color",
          value: color,
        },
        // strings
        // numbers
        // slider (range)
        // color
        // select (dropdown)
        // boolean (checkbox)
      ]
    }
  },
  // children as array of array of geometries
  process(controls, children, attributes) {
    const { color } = controls;
    attributes.stroke = color;
  },
}
