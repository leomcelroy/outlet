import { html, svg } from "lit-html";

export function drawSelectBox(state) {
  const box = state.selectBox;
  if (!box || !box.start || !box.end) return "";

  const x = Math.min(box.start[0], box.end[0]);
  const y = Math.min(box.start[1], box.end[1]);
  const width = Math.abs(box.end[0] - box.start[0]);
  const height = Math.abs(box.end[1] - box.start[1]);

  return svg`
    <rect
      x=${x}
      y=${y}
      width=${width}
      height=${height}
      class="fill-blue-500 opacity-10"
    />
  `;
}
