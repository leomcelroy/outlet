import { createRandStr } from "../utils/createRandStr.js";

const type = "demoModal";
const name = "demoModal";

export const demoModal = {
  type,
  name,
  customModal: ({ container, updateControl, close }) => {
    container.innerHTML = `
      <div class="w-20 bg-gray-200 p-2 mb-10">
        <div>Hello there!</div>
        <button class="bg-gray-300 border border-gray-400 rounded-md px-2 py-1">
          Close
        </button>
      </div>

    `;

    container.querySelector("button").addEventListener("click", () => {
      close();
    });
  },
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type,
      controls: [],
    };
  },
  process(controls, children) {
    // Only process paths, apply fill to path attributes
    return children.flat();
  },
};
