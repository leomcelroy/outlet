import { createRandStr } from "../utils/createRandStr.js";

const type = "exportPes";
const name = "Export PES";

export const exportPes = {
  type,
  name,
  applyOnce: true,
  init(defaults = {}) {
    return {
      id: createRandStr(),
      type,
      name,
      controls: [],
    };
  },
  // children as array of array of geometries
  process(controls, children, attributes) {
    console.log("Export PES");
    // console.log({ controls, children, attributes });
    // Convert geometry to stitch data

    console.log("GEOMETRIES", children);
    const stitches = convertGeometryToStitches(children);

    console.log("STITCHES", stitches);
    // Create PES file buffer
    // const pesData = createPESFile(stitches);

    // Download the file
    downloadPESFile(pesData);
  },
};

function convertGeometryToStitches(geometries) {
  const stitches = [];

  for (const geom of geometries.flat()) {
    // Convert line segments to stitches
    const { start, end } = geom;

    // Calculate relative movement
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Convert to PES coordinate system (may need scaling)
    const kx = encodeStitchValue(dx);
    const ky = encodeStitchValue(dy);

    stitches.push({ kx, ky });
  }

  return stitches;
}

function encodeStitchValue(value) {
  // Convert value to PES format
  // For regular stitches:
  // 0-63: positive values
  // 64-127: negative values (subtract 128)
  if (value >= 0) {
    return Math.min(value, 63);
  } else {
    return Math.min(Math.abs(value), 63) + 64;
  }
}

function createPESFile(stitches) {
  // Create file buffer
  const buffer = new ArrayBuffer(1024); // Initial size, will grow as needed
  const view = new DataView(buffer);

  // Write PES header
  // TODO: Calculate actual PEC start position and write it at 0x0008

  // Write PEC block
  // - Number of colors (1 for now)
  // - Design size
  // - Stitch data

  // Write stitch data
  let offset = 0; // TODO: Calculate correct offset
  stitches.forEach(({ kx, ky }) => {
    view.setUint8(offset++, kx);
    view.setUint8(offset++, ky);
  });

  // Write end of stitch marker
  view.setUint8(offset++, 255);
  view.setUint8(offset++, 0);

  return buffer;
}

function downloadPESFile(buffer) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.pes";
  a.click();

  URL.revokeObjectURL(url);
}
