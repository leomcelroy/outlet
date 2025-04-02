import { createRandStr } from "../utils/createRandStr.js";

const type = "demoModal";
const name = "demoModal";

export const demoModal = {
  type,
  name,
  customModal: ({ container, updateControl, close, controls }) => {
    container.innerHTML = `
      <div class="w-20 bg-gray-200 p-2 mb-10">
        <div>Hello there!</div>
        <div color-value>${controls.find((c) => c.id === "color").value}</div>
        <input type="text" class="w-full border border-gray-400 rounded-md px-2 py-1" />
        <button submit-btn class="bg-gray-300 border border-gray-400 rounded-md px-2 py-1">
          submit
        </button>
        <button id="close-btn"class="bg-gray-300 border border-gray-400 rounded-md px-2 py-1">
          Close
        </button>
      </div>

    `;

    container.querySelector("#close-btn").addEventListener("click", () => {
      close();
    });

    container.querySelector("[submit-btn]").addEventListener("click", () => {
      updateControl("color", container.querySelector("input").value);
      container.querySelector("[color-value]").innerHTML = controls.find(
        (c) => c.id === "color"
      ).value;
    });
  },
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
          value: options.color || "none",
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    // Only process paths, apply fill to path attributes
    return inputGeometry;
  },
};
