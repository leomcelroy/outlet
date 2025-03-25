import { html, svg } from "lit-html";
import { download } from "../utils/download.js";

export function drawDownloadButton(state) {
  return html`
    <div class="fixed bottom-0 right-0 m-4 flex gap-2 select-none">
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
        style="box-shadow: 0px 0px 1px 1px rgb(205 196 196)"
        class="hover:bg-indigo-400 bg-gray-400 hover:cursor-pointer text-black py-1 px-2 rounded-lg"
      >
        Download
      </div>
    </div>
  `;
}
