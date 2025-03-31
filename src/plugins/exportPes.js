import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolyline } from "../utils/convertPathToPolyline.js";
import { exportPES } from "../drafts/exportPES.js";
import { writePESBuffer } from "../drafts/writePESBuffer.js";
import { polylinesToPes } from "../drafts/polylinesToPes.js";
import { writePes } from "../drafts/writePes.js";
import { writePes as polylinesToPes2 } from "../drafts/polylinesToPes2.js";
import { exportDST } from "../drafts/exportDST.js";

import { downloadBuffer } from "../utils/downloadBuffer.js";

const type = "exportPes";
const name = "Export PES";

export const exportPes = {
  type,
  name,
  applyOnce: true,
  init() {
    return {
      id: createRandStr(),
      type,
      name,
      controls: [],
    };
  },
  process(controls, children) {
    console.log({ children });
    const pls = alignPolylinesToRectangle(
      children.flat().map((path) => convertPathToPolyline(path.data)),
      130,
      180
    );
    console.log({ pls });

    // const pesBuffer = writePESBuffer(pls);
    const pesBuffer = exportDST([{ polylines: pls, color: 0x0000ff }]);

    downloadBuffer("design.pes", pesBuffer);

    // Just pass through paths unchanged
    return children.flat();
  },
};

export function alignPolylinesToRectangle(polylines, width, height) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  polylines.forEach((poly) => {
    poly.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  });

  let w = maxX - minX;
  let h = maxY - minY;
  if (w === 0 || h === 0) return polylines;

  let scale = Math.min(width / w, height / h);
  let cx = (minX + maxX) / 2;
  let cy = (minY + maxY) / 2;

  return polylines.map((poly) => {
    return poly.map(([x, y]) => {
      let nx = (x - cx) * scale;
      let ny = (y - cy) * scale;
      return [nx, ny];
    });
  });
}
