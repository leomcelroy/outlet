// This writes a minimal PES v6 file with one “CEmbOne → CSewSeg” object,
// centering the design in a 130×180mm hoop. It also creates a minimal PEC
// block with addendum at the end. Most embroidery viewers should open it.
// Some might be stricter about having a fully-formed PEC block.

const HOOP_WIDTH_01MM = 1300; // 130 mm in 0.1 mm units
const HOOP_HEIGHT_01MM = 1800; // 180 mm in 0.1 mm units

// Some default thread colors (index 0 => black, 1 => red, etc.).
const DEFAULT_THREADS = [
  { r: 0, g: 0, b: 0 }, // black
  { r: 255, g: 0, b: 0 }, // red
  { r: 0, g: 255, b: 0 }, // green
  { r: 0, g: 0, b: 255 }, // blue
  { r: 255, g: 255, b: 0 }, // yellow
];

export function exportPES(data) {
  const bytes = [];

  // Little-endian writing helpers
  const writeInt8 = (n) => bytes.push(n & 0xff);
  const writeInt16LE = (n) => {
    bytes.push(n & 0xff, (n >> 8) & 0xff);
  };
  const writeInt32LE = (n) => {
    bytes.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff);
  };
  const writeFloat32LE = (val) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, val, true);
    const arr = new Uint8Array(buf);
    for (let i = 0; i < arr.length; i++) {
      bytes.push(arr[i]);
    }
  };
  const writeStringAscii = (str) => {
    for (let i = 0; i < str.length; i++) {
      writeInt8(str.charCodeAt(i));
    }
  };

  // PES strings can be length+ASCII or 16-bit-length+ASCII:
  const writePesString8 = (str) => {
    if (!str) {
      writeInt8(0);
      return;
    }
    if (str.length > 255) str = str.slice(0, 255);
    writeInt8(str.length);
    writeStringAscii(str);
  };
  const writePesString16 = (str) => {
    if (!str) {
      writeInt16LE(0);
      return;
    }
    writeInt16LE(str.length);
    for (let i = 0; i < str.length; i++) {
      writeInt8(str.charCodeAt(i));
    }
  };

  // Find bounding box of all polylines
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  data.forEach(({ polylines }) => {
    polylines.forEach((points) => {
      points.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
  });

  // If no geometry, write a trivial PES v6 with no stitches
  if (!isFinite(minX)) {
    writeStringAscii("#PES0060");
    // 4-byte PEC offset placeholder
    for (let i = 0; i < 4; i++) writeInt8(0);
    // Patch it to point here
    const pecOffset = bytes.length;
    bytes[8] = pecOffset & 0xff;
    bytes[9] = (pecOffset >> 8) & 0xff;
    bytes[10] = (pecOffset >> 16) & 0xff;
    bytes[11] = (pecOffset >> 24) & 0xff;
    // Minimal stub
    writeStringAscii("LA");
    writeInt8(0);
    return new Uint8Array(bytes);
  }

  // Compute the raw design size
  const designWidth = maxX - minX;
  const designHeight = maxY - minY;

  // We'll scale down if it exceeds the hoop
  const wLimit = HOOP_WIDTH_01MM / 10; // convert to mm
  const hLimit = HOOP_HEIGHT_01MM / 10;
  let scale = 1;
  if (designWidth > wLimit) {
    scale = Math.min(scale, wLimit / designWidth);
  }
  if (designHeight > hLimit) {
    scale = Math.min(scale, hLimit / designHeight);
  }

  // We'll center around the hoop's midpoint
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Transform function => shift design center to (0,0), scale, then to PES coords (0.1mm)
  function transform(x, y) {
    const dx = (x - centerX) * scale * 10;
    const dy = (y - centerY) * scale * 10;
    return [Math.round(dx), Math.round(dy)];
  }

  // Find how many thread indices we need
  let maxColorIndex = 0;
  data.forEach((d) => {
    if (d.color > maxColorIndex) maxColorIndex = d.color;
  });
  const numThreads = maxColorIndex + 1;

  // PES signature
  writeStringAscii("#PES0060");

  // Placeholder for the PEC offset
  const pecOffsetPos = bytes.length;
  writeInt32LE(0);

  // Minimal PES v6 header
  // Hoop size indicator (1 => typically 130×180)
  writeInt16LE(1);
  // Subversion "02"
  writeStringAscii("02");
  // 5 metadata strings => blank
  writePesString8("");
  writePesString8("");
  writePesString8("");
  writePesString8("");
  writePesString8("");

  // 2 flags: optimizeHoopChange=0, designPageIsCustom=0
  writeInt16LE(0);
  writeInt16LE(0);

  // Hoop width/height => we’ll use 130×180 to match the code’s explanation
  writeInt16LE(130);
  writeInt16LE(180);

  // useExistingDesignArea=0
  writeInt16LE(0);

  // designWidth, designHeight => 200×200 typical
  writeInt16LE(200);
  writeInt16LE(200);

  // designPageSectionWidth, designPageSectionHeight => 100×100
  writeInt16LE(100);
  writeInt16LE(100);

  // p6 unknown => 100
  writeInt16LE(100);

  // designPageBackgroundColor=7, designPageForegroundColor=19
  writeInt16LE(7);
  writeInt16LE(19);

  // ShowGrid=1, WithAxes=1, SnapToGrid=0, GridInterval=100
  writeInt16LE(1);
  writeInt16LE(1);
  writeInt16LE(0);
  writeInt16LE(100);

  // p9=1, optimizeEntryExitPoints=0
  writeInt16LE(1);
  writeInt16LE(0);

  // fromImageStringLength => 0
  writeInt8(0);

  // 6 floats for image transform => identity
  writeFloat32LE(1);
  writeFloat32LE(0);
  writeFloat32LE(0);
  writeFloat32LE(1);
  writeFloat32LE(0);
  writeFloat32LE(0);

  // #programmableFills=0, #motifs=0, #feathers=0
  writeInt16LE(0);
  writeInt16LE(0);
  writeInt16LE(0);

  // Thread list
  writeInt16LE(numThreads);
  for (let i = 0; i < numThreads; i++) {
    // CatalogNumber => none
    writeInt8(0);
    // RGB
    const thr = DEFAULT_THREADS[i] || { r: 0, g: 0, b: 0 };
    writeInt8(thr.r);
    writeInt8(thr.g);
    writeInt8(thr.b);
    // unknown=0
    writeInt8(0);
    // threadType=0x0A => custom color
    writeInt32LE(0x0a);
    // description, brand, chart => empty
    writeInt8(0);
    writeInt8(0);
    writeInt8(0);
  }

  // #Objects => 1 (CEmbOne -> CSewSeg)
  writeInt16LE(1);

  // Write “CEmbOne”
  // length=7, then ASCII
  writeInt16LE(7);
  writeStringAscii("CEmbOne");

  // 16 bytes => extents => zero for minimal
  for (let i = 0; i < 8; i++) writeInt16LE(0);

  // 6 floats => identity transform
  writeFloat32LE(1);
  writeFloat32LE(0);
  writeFloat32LE(0);
  writeFloat32LE(1);

  // Translate => center of 130×180 => (650, 900)
  writeFloat32LE(HOOP_WIDTH_01MM / 2);
  writeFloat32LE(HOOP_HEIGHT_01MM / 2);

  // Next fields => unknown=1, Xloc=0, Yloc=0
  writeInt16LE(1);
  writeInt16LE(0);
  writeInt16LE(0);

  // bounding box in PES coords
  const bw = Math.round(designWidth * scale * 10);
  const bh = Math.round(designHeight * scale * 10);
  writeInt16LE(bw);
  writeInt16LE(bh);

  // 8 unknown bytes => zero
  for (let i = 0; i < 8; i++) writeInt8(0);

  // #sections => patch later
  const sectionCountPos = bytes.length;
  writeInt16LE(0);

  // 0xFFFF,0 => more blocks
  writeInt16LE(0xffff);
  writeInt16LE(0x0000);

  // “CSewSeg”
  writeInt16LE(7);
  writeStringAscii("CSewSeg");

  let sections = 0;
  let currentColor = -1;
  let firstSection = true;
  const colorLog = [];
  let sectionIndex = 0;

  // Build jump/stitch blocks
  data.forEach(({ polylines, color }) => {
    polylines.forEach((points) => {
      if (!points.length) return;
      if (!firstSection) {
        // 0x8003 => continue
        writeInt16LE(0x8003);
      }
      firstSection = false;

      if (color !== currentColor) {
        colorLog.push([sectionIndex, color]);
        currentColor = color;
      }

      // JUMP block => type=1, color, 2 coords
      const [jx, jy] = transform(points[0][0], points[0][1]);
      writeInt16LE(1); // jump
      writeInt16LE(color);
      writeInt16LE(2);
      writeInt16LE(jx);
      writeInt16LE(jy);
      sections++;
      sectionIndex++;

      // STITCH block => type=0, color, #points
      writeInt16LE(0);
      writeInt16LE(color);
      writeInt16LE(points.length);
      for (let i = 0; i < points.length; i++) {
        const [sx, sy] = transform(points[i][0], points[i][1]);
        writeInt16LE(sx);
        writeInt16LE(sy);
      }
      sections++;
      sectionIndex++;
    });
  });

  // Write color list
  writeInt16LE(colorLog.length);
  colorLog.forEach(([si, ci]) => {
    writeInt16LE(si);
    writeInt16LE(ci);
  });

  // Patch #sections
  bytes[sectionCountPos] = sections & 0xff;
  bytes[sectionCountPos + 1] = (sections >> 8) & 0xff;

  // No more blocks => 0,0
  writeInt16LE(0);
  writeInt16LE(0);

  // Minimal “order data”: 2 ints of 0, then N pairs
  writeInt32LE(0);
  writeInt32LE(0);
  for (let i = 0; i < colorLog.length; i++) {
    writeInt32LE(i);
    writeInt32LE(0);
  }

  // Now patch in the PEC offset
  const pecOffset = bytes.length;
  bytes[pecOffsetPos] = pecOffset & 0xff;
  bytes[pecOffsetPos + 1] = (pecOffset >> 8) & 0xff;
  bytes[pecOffsetPos + 2] = (pecOffset >> 16) & 0xff;
  bytes[pecOffsetPos + 3] = (pecOffset >> 24) & 0xff;

  // Minimal PEC-like stub => “LA” + 0
  writeStringAscii("LA");
  writeInt8(0);

  // Addendum block => color indexes, pad to 128, 0x90 zero bytes per color, then RGB
  const colorIndexes = [];
  if (!colorLog.length) {
    // If truly no color => write one dummy 0xFF
    colorIndexes.push(0xff);
  } else {
    colorLog.forEach(([_, c]) => {
      // Often 0 => 0xFF in older logic. We can do direct usage or clamp:
      let idx = c & 0xff;
      if (idx === 0) idx = 0xff;
      colorIndexes.push(idx);
    });
  }

  colorIndexes.forEach((ci) => writeInt8(ci));
  for (let i = colorIndexes.length; i < 128; i++) {
    writeInt8(0x20);
  }
  for (let i = 0; i < colorIndexes.length; i++) {
    // 0x90 zero bytes
    for (let j = 0; j < 0x90; j++) writeInt8(0);
  }
  // Then actual RGB
  colorIndexes.forEach((ci) => {
    const cindex = ci === 0xff ? 0 : ci;
    const thr = DEFAULT_THREADS[cindex] || { r: 0, g: 0, b: 0 };
    writeInt8(thr.r);
    writeInt8(thr.g);
    writeInt8(thr.b);
  });

  // v6 ends with 2 bytes of 0
  writeInt16LE(0);

  return new Uint8Array(bytes);
}
