import { createRandStr } from "../utils/createRandStr.js";

const type = "fill";
const name = "Fill";

export const fill = {
  type,
  name,
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type: "fill",
      enabled: true,
      controls: [
        {
          id: "color",
          type: "color",
          value: options.color || "#326BC8",
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { color } = controls;
    // Only process paths, apply fill to path attributes
    return inputGeometry.map((path) => ({
      polylines: path.polylines,
      attributes: {
        ...path.attributes,
        fill: color,
      },
    }));
  },
};

/*

{
  name: "Fill",
  parameters: {
    color: "#326BC8"
  },
  modal: ({ 
    readParameter, 
    writeParameter, 
    layerGeometry,
    // readGeometry, 
    // writeGeometry, 
    container, 
    close 
  }) => {
    const color = readParameter("color");
    container.innerHTML = `
    <div class="flex flex-col gap-2">
      <div class="text-sm text-gray-500">Color</div>
      <input type="color" value="${color}" />
      <button class="bg-blue-500 text-white px-4 py-2 rounded-md">Close</button>
    </div>
    `;  

    container.querySelector("input").addEventListener("change", (e) => {
      writeParameter("color", e.target.value);
    });

    container.querySelector("button").addEventListener("click", () => {
      close();
    });
  },
  process: ({ parameters, inputGeometry }) => {
    const { color } = parameters;
    return inputGeometry.map((path) => ({
      polylines: path.polylines,
      attributes: {
        ...path.attributes,
        fill: color,
      },
    }));
  }
}

*/
