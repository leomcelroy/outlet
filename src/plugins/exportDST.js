import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolylines } from "../utils/convertPathToPolylines.js";
import { tajimaDSTExport } from "../drafts/tajimaDSTExport.js";

import { downloadBuffer } from "../utils/downloadBuffer.js";
import { bounds } from "../utils/bounds.js";
import { translate, scale } from "../utils/affineTransformations.js";

const type = "exportDST";
const name = "Export DST";

export const exportDST = {
  type,
  name,
  applyOnce: true,
  init() {
    return {
      id: createRandStr(),
      type,
      name,
      controls: [
        {
          id: "stitchLength",
          label: "Stitch Length (mm)",
          type: "number",
          value: 3,
        },
        {
          id: "maxDimension",
          label: "Max Dimension (mm)",
          type: "number",
          value: 50,
        },
        {
          id: "designName",
          label: "Design Name",
          type: "string",
          value: "Untitled",
        },
      ],
    };
  },
  process(controls, outputGeometry) {
    const pls = outputGeometry
      .map((path) => convertPathToPolylines(path.data))
      .flat();

    const bbox = bounds(pls);
    const targetWidth = controls.maxDimension;
    const targetHeight = controls.maxDimension;
    const border = 0;
    const targetCenter = [0, 0];
    const scaleFactor = Math.min(
      (targetWidth - border * 2) / bbox.width,
      (targetHeight - border * 2) / bbox.height
    );

    scale(pls, scaleFactor);
    translate(pls, targetCenter, bounds(pls).cc);

    const dstBuffer = tajimaDSTExport({
      data: [{ polylines: pls, color: 0x0000ff }],
      stitchLength: controls.stitchLength,
    });

    downloadBuffer(`${controls.designName}.dst`, dstBuffer);
  },
};
