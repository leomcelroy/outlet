import { html } from "lit-html";
import { download } from "../utils/download.js";

export function drawTopBar(state) {
  return html`
    <!-- Top bar -->
    <div class="bg-gray-100 border-b border-gray-400 shadow-md">
      <div
        @click=${(e) => {
          const name = prompt("Please provide a filename.");
          if (name === "" || !name) return;

          const file = JSON.stringify({
            geometries: state.geometries,
            params: state.params,
          });

          download(`${name}.sketch.json`, file);
        }}
        class="hover:bg-gray-200 w-fit p-2 cursor-pointer"
      >
        Download
      </div>
    </div>
  `;
}
