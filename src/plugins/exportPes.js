import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolyline } from "../utils/convertPathToPolyline.js";
import { resamplePolylines } from "../utils/resamplePolylines.js";
import { exportPES } from "../drafts/exportPES.js";
import { writePESBuffer } from "../drafts/writePESBuffer.js";
import { polylinesToPes } from "../drafts/polylinesToPes.js";
import { writePes } from "../drafts/writePes.js";
import { writePes as polylinesToPes2 } from "../drafts/polylinesToPes2.js";
import { exportDST } from "../drafts/exportDST.js";
import { exportDST2 } from "../drafts/exportDST2.js";
import { tajimaDSTExport } from "../drafts/tajimaDSTExport.js";

import { downloadBuffer } from "../utils/downloadBuffer.js";
import { bounds } from "../utils/bounds.js";
import { translate, scale } from "../utils/affineTransformations.js";

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

    const pls = children.flat().map((path) => convertPathToPolyline(path.data));
    const bbox = bounds(pls);
    const targetWidth = 40;
    const targetHeight = 40;
    const border = 0;
    const targetCenter = [0, 0];
    const scaleFactor = Math.min(
      (targetWidth - border * 2) / bbox.width,
      (targetHeight - border * 2) / bbox.height
    );

    scale(pls, scaleFactor);
    translate(pls, targetCenter, bounds(pls).cc);
    // resamplePolylines(pls, 1);

    console.log({ pls });

    // const pesBuffer = writePESBuffer(pls);
    const pesBuffer = tajimaDSTExport([{ polylines: pls, color: 0x0000ff }]);

    downloadBuffer("design.dst", pesBuffer);

    // Just pass through paths unchanged
    return children.flat();
  },
};

export function alignPolylinesToHoop(polylines, hoopWidth, hoopHeight, border) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let poly of polylines) {
    for (let [px, py] of poly) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  let w = maxX - minX;
  let h = maxY - minY;
  if (w === 0 || h === 0) return polylines;

  // Compute scale so that the design fits inside (hoopWidth - 2*border) x (hoopHeight - 2*border)
  let scale = Math.min(
    (hoopWidth - border * 2) / w,
    (hoopHeight - border * 2) / h
  );

  // We'll center it at (0,0) after scaling
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;

  // Scale and recenter
  return polylines.map((poly) =>
    poly.map(([x, y]) => {
      let sx = (x - centerX) * scale;
      let sy = (y - centerY) * scale;
      return [sx, sy];
    })
  );
}
