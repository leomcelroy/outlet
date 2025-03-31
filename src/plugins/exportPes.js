import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolyline } from "../utils/convertPathToPolyline.js";
import { exportPES } from "../drafts/exportPES.js";
import { writePESBuffer } from "../drafts/writePESBuffer.js";
import { polylinesToPes } from "../drafts/polylinesToPes.js";

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
    const pls = children.flat().map((path) => convertPathToPolyline(path.data));
    console.log({ pls });

    // const pesBuffer = writePESBuffer(pls);
    const pesBuffer = polylinesToPes([{ polylines: pls, color: 0 }], {
      version: 6,
      truncated: true,
      designName: "Design",
      hoopWidth: 130,
      hoopHeight: 180,
      scaleToFit: true,
      centerInHoop: true,
    });

    downloadBuffer("design.pes", pesBuffer);

    // Just pass through paths unchanged
    return children.flat();
  },
};
