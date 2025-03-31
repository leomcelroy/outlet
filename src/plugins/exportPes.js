import { createRandStr } from "../utils/createRandStr.js";

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
    // Just pass through paths unchanged, actual export happens in UI
    return children.flat();
  },
  // Keep any existing export-specific methods
};

function convertGeometryToStitches(geometries) {
  const stitches = [];
  const SCALE = 10; // 1 unit = 0.1mm in PES format

  // Track current position for relative movements
  let currentX = 0;
  let currentY = 0;

  // First move to initial position
  if (geometries.length > 0) {
    const first = geometries[0];
    // Convert to absolute PES coordinates first
    const startX = Math.round(first.x1 * SCALE);
    const startY = Math.round(first.y1 * SCALE);

    // First stitch needs trim flag and special encoding
    stitches.push({
      type: "trim",
      kx: startX,
      ky: startY,
      isAbsolute: true,
    });

    // Move to first endpoint
    const dx = Math.round(first.x2 * SCALE) - startX;
    const dy = Math.round(first.y2 * SCALE) - startY;

    stitches.push({
      type: "normal",
      kx: dx,
      ky: dy,
    });

    currentX = startX + dx;
    currentY = startY + dy;
  }

  // Handle remaining geometries
  for (let i = 1; i < geometries.length; i++) {
    const geom = geometries[i];
    const targetX = Math.round(geom.x2 * SCALE);
    const targetY = Math.round(geom.y2 * SCALE);

    // Calculate relative movement
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    if (Math.abs(dx) > 63 || Math.abs(dy) > 63) {
      // For large movements, split into jump stitch
      stitches.push({ type: "jump", kx: dx, ky: dy });
    } else {
      stitches.push({ type: "normal", kx: dx, ky: dy });
    }

    currentX = targetX;
    currentY = targetY;
  }

  return stitches;
}

function encodeStitchValue(value) {
  // Convert value to PEC format
  // 0-63: positive values
  // 64-127: negative values (subtract 128)
  if (value >= 0) {
    return Math.min(value, 63);
  } else {
    return Math.min(Math.abs(value), 63) + 64;
  }
}

function createPESFile(stitches) {
  const buffer = new ArrayBuffer(8192);
  const view = new DataView(buffer);
  let offset = 0;

  // Write PES signature (#PES0060)
  const signature = "#PES0060";
  for (let i = 0; i < signature.length; i++) {
    view.setUint8(offset++, signature.charCodeAt(i));
  }

  // Save position for PEC block pointer
  const pecBlockPointerPos = offset;
  offset += 4;

  // Write PES v6 header
  view.setUint16(offset, 1, true); // Hoop indicator (1 = 130x180 or above)
  offset += 2;

  // Write subversion bytes
  view.setUint8(offset++, 0x30); // First subversion byte
  view.setUint8(offset++, 0x32); // Second subversion byte

  // Write metadata strings
  const writeString = (str) => {
    if (!str) {
      view.setUint8(offset++, 0);
      return;
    }
    view.setUint8(offset++, str.length);
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  };

  // Write empty strings for metadata
  writeString("Test Design"); // Design name
  writeString(""); // Category
  writeString("Hannah"); // Author
  writeString(""); // Keywords
  writeString("wheeee"); // Comments

  // Write design settings
  view.setUint16(offset, 0, true); // optimizeHoopChange false
  offset += 2;
  view.setUint16(offset, 0, true); // DesignPageIsCustom false
  offset += 2;

  // Write hoop and design dimensions
  view.setUint16(offset, 0x64, true); // HoopWidth (100)
  offset += 2;
  view.setUint16(offset, 0x64, true); // HoopHeight (100)
  offset += 2;
  view.setUint16(offset, 0, true); // Design Page Area
  offset += 2;
  view.setUint16(offset, 0xc8, true); // designWidth (200)
  offset += 2;
  view.setUint16(offset, 0xc8, true); // designHeight (200)
  offset += 2;
  view.setUint16(offset, 0x64, true); // designPageSectionWidth (100)
  offset += 2;
  view.setUint16(offset, 0x64, true); // designPageSectionHeight (100)
  offset += 2;
  view.setUint16(offset, 0x64, true); // p6 unknown (100)
  offset += 2;

  // Write design page settings
  view.setUint16(offset, 0x07, true); // designPageBackgroundColor
  offset += 2;
  view.setUint16(offset, 0x13, true); // designPageForegroundColor
  offset += 2;
  view.setUint16(offset, 0x01, true); // ShowGrid true
  offset += 2;
  view.setUint16(offset, 0x01, true); // WithAxes true
  offset += 2;
  view.setUint16(offset, 0x00, true); // SnapToGrid false
  offset += 2;
  view.setUint16(offset, 100, true); // GridInterval
  offset += 2;
  view.setUint16(offset, 0x01, true); // p9 unknown
  offset += 2;
  view.setUint16(offset, 0, true); // OptimizeEntryExitPoints false
  offset += 2;

  // Write image data
  view.setUint8(offset++, 0); // fromImageStringLength

  // Write image transformation matrix
  const writeFloat = (value) => {
    view.setFloat32(offset, value, true);
    offset += 4;
  };

  writeFloat(1.0); // image scaleX
  writeFloat(0.0); // image shearX
  writeFloat(0.0); // image shearY
  writeFloat(1.0); // image scaleY
  writeFloat(0.0); // image translateX
  writeFloat(0.0); // image translateY

  // Write pattern counts
  view.setUint16(offset, 0, true); // numberOfProgrammableFillPatterns
  offset += 2;
  view.setUint16(offset, 0, true); // NumberOfMotifPatterns
  offset += 2;
  view.setUint16(offset, 0, true); // NumberOfFeatherPatterns
  offset += 2;

  // Write thread information
  view.setUint16(offset, 1, true); // Number of threads (using 1 thread)
  offset += 2;

  // Write thread data
  const catalogNumber = "1"; // Simple thread number
  writeString(catalogNumber);

  // Write thread color (using blue)
  view.setUint8(offset++, 0); // Red
  view.setUint8(offset++, 0); // Green
  view.setUint8(offset++, 255); // Blue
  view.setUint8(offset++, 0); // Unknown/padding

  // Write thread type and metadata
  view.setUint32(offset, 0xa, true); // Thread type
  offset += 4;
  writeString("Blue Thread"); // Description
  writeString("Generic"); // Brand
  writeString(""); // Chart

  // Write number of objects
  view.setUint16(offset, 1, true); // One object
  offset += 2;

  // Calculate design boundaries
  const bounds = calculateBounds(stitches);

  // Write PES block
  offset = writePESBlock(view, offset, stitches, bounds);

  // Write PEC block pointer
  view.setUint32(pecBlockPointerPos, offset, true);

  // Write PEC block
  offset = writePECBlock(view, offset, stitches);

  // Write PES v6 addendum after PEC block
  offset = writePESv6Addendum(view, offset);

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
    view.setUint16(offset, stitch.type === "jump" ? 1 : 0, true); // Jump stitch flag
    offset += 2;
    view.setUint16(offset, 0, true); // Color code (using first color)
    offset += 2;
    view.setUint16(offset, 1, true); // Number of points in segment
    offset += 2;

    // For absolute positions (first stitch), write directly
    // For relative positions, write the delta
    if (stitch.isAbsolute) {
      view.setInt16(offset, stitch.kx, true);
      offset += 2;
      view.setInt16(offset, stitch.ky, true);
      offset += 2;
    } else {
      view.setInt16(offset, stitch.kx, true);
      offset += 2;
      view.setInt16(offset, stitch.ky, true);
      offset += 2;
    }
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

  // Calculate translations to center in 130x180mm hoop
  // 350 is the distance from 0,0 that the 130x180mm hoop is stored
  const transX = 350 + 1300 / 2 - (bounds.right - bounds.left) / 2;
  const transY = 100 + 1800 / 2 - (bounds.bottom - bounds.top) / 2;

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
    if (stitch.type === "trim") {
      // Special encoding for trim stitches
      const dx = stitch.kx;
      const dy = stitch.ky;

      // Encode as long form with trim flag
      const encodedX = encodeLongForm(dx);
      const encodedY = encodeLongForm(dy);

      view.setUint16(offset, encodedX | 0x8000, true); // Set trim bit
      offset += 2;
      view.setUint16(offset, encodedY | 0x8000, true);
      offset += 2;

      // Add required zeros after trim
      view.setUint8(offset++, 0x00);
      view.setUint8(offset++, 0x00);
    } else if (stitch.type === "jump") {
      // Format jump stitch
      const jumpX = Math.min(Math.abs(stitch.kx), 2047);
      const jumpY = Math.min(Math.abs(stitch.ky), 2047);

      view.setUint8(offset++, 128 + (jumpX >> 8));
      view.setUint8(offset++, jumpX & 0xff);
      view.setUint8(offset++, 128 + (jumpY >> 8));
      view.setUint8(offset++, jumpY & 0xff);
    } else {
      // Normal stitch - but check if we need long form
      const dx = stitch.kx;
      const dy = stitch.ky;

      if (Math.abs(dx) >= 64 || Math.abs(dy) >= 64) {
        // Need long form encoding
        view.setUint16(offset, encodeLongForm(dx), true);
        offset += 2;
        view.setUint16(offset, encodeLongForm(dy), true);
        offset += 2;
      } else {
        // Regular short form encoding
        view.setUint8(offset++, encodeStitchValue(dx));
        view.setUint8(offset++, encodeStitchValue(dy));
      }
    }

    if (!stitch.isAbsolute) {
      currentX += stitch.kx;
      currentY += stitch.ky;
    } else {
      currentX = stitch.kx;
      currentY = stitch.ky;
    }
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

// Add helper function for long form encoding
function encodeLongForm(value) {
  value &= 0x0fff; // Keep 12 bits
  value |= 0x8000; // Set long form bit
  return value;
}

function writePESv6Addendum(view, offset) {
  // Write PEC color count (N-1 format, 0 becomes FF)
  view.setUint8(offset++, 0xff);

  // Pad with spaces (0x20) to 128 bytes
  for (let i = 0; i < 127; i++) {
    view.setUint8(offset++, 0x20);
  }

  // Write 144 bytes of zeros for each color (we have 1 color)
  for (let i = 0; i < 144; i++) {
    view.setUint8(offset++, 0);
  }

  // Write RGB color value
  view.setUint8(offset++, 0); // R
  view.setUint8(offset++, 0); // G
  view.setUint8(offset++, 255); // B

  // Write v6 terminator
  view.setUint16(offset, 0, true);
  offset += 2;

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
