import { createRandStr } from "../../utils/createRandStr.js";
import { createListener } from "../../utils/createListener.js";
import { vectorizeImg } from "./vectorizeImg.js";

const type = "importImage";
const name = "Import Image";

export const importImage = {
  type,
  name,
  customModal: ({ container, updateControl, close, controls }) => {
    container.innerHTML = `<div id="root"></div>`;
    const root = container.querySelector("#root");
    const listen = createListener(root);

    const render = () => {
      const controlValues = Object.fromEntries(
        controls.map((c) => [c.id, c.value])
      );

      const hasImage = controlValues.imgData && controlValues.imgData !== "";

      root.innerHTML = `
        <div class="w-96 bg-white p-4 rounded-lg shadow-lg">
          <h3 class="text-lg font-semibold mb-4">Import Image</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Select Image:</label>
            <input 
              type="file" 
              accept="image/*"
              file-input
              class="w-full border border-gray-300 rounded-md px-3 py-2" 
            />
          </div>

          ${
            hasImage
              ? `
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Preview:</label>
                    <div class="border border-gray-300 rounded-md p-2 bg-gray-50">
                      <img 
                        src="${controlValues.imgData}" 
                        alt="Preview" 
                        class="max-w-full max-h-48 mx-auto block"
                      />
                    </div>
                  </div>
                `
              : ""
          }

          <div class="flex gap-2">
            <button 
              process-btn 
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              ${!hasImage ? "disabled" : ""}
            >
              Import Image
            </button>
            <button 
              close-btn 
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      `;
    };

    render();

    listen("click", "[close-btn]", () => {
      close();
    });

    listen("change", "[file-input]", (e) => {
      const file = e.target.files[0];
      console.log("File selected:", file);
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          console.log(
            "File read complete, data length:",
            event.target.result.length
          );
          updateControl("imgData", event.target.result);
          const polylines = await vectorizeImg(event.target.result);
          console.log({ polylines });
          updateControl("polylines", polylines);
          render();
        };
        reader.readAsDataURL(file);
      }
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
          id: "imgData",
          value: "",
        },
        {
          id: "polylines",
          value: [],
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    const { imgData, polylines } = controls;

    if (imgData && polylines && polylines.length > 0) {
      // Return the vectorized polylines in the correct format
      const result = [
        {
          polylines: polylines,
          attributes: {
            stroke: "black",
            strokeWidth: 1,
            fill: "blue",
          },
        },
      ];

      console.log("Returning vectorized polylines:", {
        result,
        count: result.length,
      });
      return result;
    }

    console.log("No vectorization data available, returning input geometry:", {
      inputGeometry,
    });
    // If no image data or polylines, just pass through the input geometry
    return inputGeometry;
  },
};
