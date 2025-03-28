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
    const stitches = convertGeometryToStitches(
      children.flat().filter((g) => g.type === "line")
    );

    console.log("STITCHES", stitches);
    // Create PES file buffer
    const pesData = createPESFile(stitches);

    // Download the file
    downloadPESFile(pesData);
  },
};

function convertGeometryToStitches(geometries) {
  const stitches = [];
  const SCALE = 1; // Scale factor to convert to embroidery units

  for (const geom of geometries) {
    // Convert line segments to stitches
    const { x1, y1, x2, y2 } = geom;

    // Calculate relative movement and scale to embroidery units
    const dx = Math.round((x2 - x1) * SCALE);
    const dy = Math.round((y2 - y1) * SCALE);

    stitches.push({ kx: dx, ky: dy });
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
  // We'll implement version 1 of PES format
  const buffer = new ArrayBuffer(8192); // Larger initial size
  const view = new DataView(buffer);
  let offset = 0;

  // Write PES signature
  const signature = "#PES0001";
  for (let i = 0; i < signature.length; i++) {
    view.setUint8(offset++, signature.charCodeAt(i));
  }

  // Save position for PEC block pointer
  const pecBlockPointerPos = offset;
  offset += 4; // Skip 4 bytes for now

  // Write PES header v1
  view.setUint16(offset, 0x01, true); // Scale to fit
  offset += 2;
  view.setUint16(offset, 0x01, true); // Hoop size (130x180 or above)
  offset += 2;
  view.setUint16(offset, 1, true); // Number of distinct blocks
  offset += 2;

  // Write block header
  view.setUint16(offset, 0xffff, true);
  offset += 2;
  view.setUint16(offset, 0x0000, true);
  offset += 2;

  // Calculate design boundaries
  const bounds = calculateBounds(stitches);

  // Write PES block
  offset = writePESBlock(view, offset, stitches, bounds);

  // Write PEC block pointer
  view.setUint32(pecBlockPointerPos, offset, true);

  // Write PEC block
  offset = writePECBlock(view, offset, stitches);

  // Return only the used portion of the buffer
  return buffer.slice(0, offset);
}

function calculateBounds(stitches) {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  let x = 0,
    y = 0;

  for (const stitch of stitches) {
    x += decodeStitchValue(stitch.kx);
    y += decodeStitchValue(stitch.ky);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { left: minX, top: minY, right: maxX, bottom: maxY };
}

function writePESBlock(view, offset, stitches, bounds) {
  // Write EMB_ONE header
  const embOne = "CEmbOne";
  for (let i = 0; i < embOne.length; i++) {
    view.setUint8(offset++, embOne.charCodeAt(i));
  }

  // Write design boundaries and transformation matrix
  offset = writeSewSegHeader(view, offset, bounds);

  // Write stitch data
  const embSeg = "CSewSeg";
  for (let i = 0; i < embSeg.length; i++) {
    view.setUint8(offset++, embSeg.charCodeAt(i));
  }

  // Write stitch segments
  for (const stitch of stitches) {
    view.setUint16(offset, 0, true); // Regular stitch flag
    offset += 2;
    view.setUint16(offset, 0, true); // Color code (using first color)
    offset += 2;
    view.setUint16(offset, 1, true); // Number of points in segment
    offset += 2;
    view.setInt16(offset, stitch.kx, true);
    offset += 2;
    view.setInt16(offset, stitch.ky, true);
    offset += 2;
  }

  // Write end marker
  view.setUint16(offset, 0x8003, true);
  offset += 2;

  return offset;
}

function writeSewSegHeader(view, offset, bounds) {
  // Write empty bounds
  for (let i = 0; i < 8; i++) {
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  // Write transformation matrix (identity + translation)
  view.setFloat32(offset, 1, true); // Scale X
  offset += 4;
  view.setFloat32(offset, 0, true); // Shear X
  offset += 4;
  view.setFloat32(offset, 0, true); // Shear Y
  offset += 4;
  view.setFloat32(offset, 1, true); // Scale Y
  offset += 4;

  // Calculate translations
  const transX = 350 + 1300 / 2 - (bounds.right - bounds.left) / 2;
  const transY =
    100 +
    (bounds.bottom - bounds.top) +
    1800 / 2 -
    (bounds.bottom - bounds.top) / 2;

  view.setFloat32(offset, transX, true);
  offset += 4;
  view.setFloat32(offset, transY, true);
  offset += 4;

  return offset;
}

function decodeStitchValue(value) {
  if (value >= 64) {
    return -(value - 64);
  }
  return value;
}

function writePECBlock(view, offset, stitches) {
  const pecStart = offset;

  // Write "LA:" label that marks the beginning of PEC block
  const label = "LA:";
  for (let i = 0; i < label.length; i++) {
    view.setUint8(offset++, label.charCodeAt(i));
  }

  // Write initial 0x16 byte
  view.setUint8(offset++, 0x16);

  // Write 13 empty bytes
  for (let i = 0; i < 13; i++) {
    view.setUint8(offset++, 0x00);
  }

  // pecStart + 49: Number of colors
  offset = pecStart + 49;
  view.setUint8(offset++, 1); // Single color for now

  // pecStart + 50: Thread colors
  view.setUint8(offset++, 1); // First color

  // Fill remaining color slots with 0x20 (space)
  for (let i = 0; i < 463; i++) {
    view.setUint8(offset++, 0x20);
  }

  // pecStart + 515: Graphic pointer (3 bytes, LSB first)
  // We'll set this to point to the end of our stitch data
  const graphicPointerPos = offset;
  offset += 3;

  // Calculate design size in PEC coordinates
  const bounds = calculateBounds(stitches);
  const width = Math.round(Math.abs(bounds.right - bounds.left));
  const height = Math.round(Math.abs(bounds.bottom - bounds.top));

  // pecStart + 521: Design size (2 bytes each, LSB first)
  view.setUint16(offset, width, true);
  offset += 2;
  view.setUint16(offset, height, true);
  offset += 2;

  // Skip to stitch data section (pecStart + 533)
  offset = pecStart + 533;

  // Write stitch data
  let currentX = 0,
    currentY = 0;
  for (const stitch of stitches) {
    const targetX = stitch.kx;
    const targetY = stitch.ky;

    // Calculate the distance needed
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    if (Math.abs(dx) > 63 || Math.abs(dy) > 63) {
      // Need jump stitch
      const jumpX = Math.min(Math.abs(dx), 2047);
      const jumpY = Math.min(Math.abs(dy), 2047);

      // Format jump stitch: (128 + n) followed by y value
      // where n is the high bits of the jump
      view.setUint8(offset++, 128 + (jumpX >> 8));
      view.setUint8(offset++, jumpX & 0xff);
      view.setUint8(offset++, 128 + (jumpY >> 8));
      view.setUint8(offset++, jumpY & 0xff);
    }

    // Write normal stitch
    view.setUint8(offset++, encodeStitchValue(dx));
    view.setUint8(offset++, encodeStitchValue(dy));

    currentX = targetX;
    currentY = targetY;
  }

  // Write end of stitches marker
  view.setUint8(offset++, 0xff);
  view.setUint8(offset++, 0x00);

  // Write graphic pointer (points to current position)
  const graphicStart = offset;
  view.setUint8(graphicPointerPos, graphicStart & 0xff);
  view.setUint8(graphicPointerPos + 1, (graphicStart >> 8) & 0xff);
  view.setUint8(graphicPointerPos + 2, (graphicStart >> 16) & 0xff);

  // Write pixel graphic section (228 bytes)
  // For now, just write empty graphic
  for (let i = 0; i < 228; i++) {
    view.setUint8(offset++, 0x00);
  }

  return offset;
}

function downloadPESFile(buffer) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.pes";
  a.click();

  URL.revokeObjectURL(url);

  a.remove();
}
