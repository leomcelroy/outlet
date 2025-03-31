// 1) Scale and center your polylines so they fit into the hoop.
// 2) Subdivide any "too large" moves before encoding them to DST, so you never get the
//    "Y move too large for DST encoding" error again.

const STITCH = 0;
const JUMP = 1;
const COLOR_CHANGE = 5;
const END = 4;

// Subdivide a single move if it's too large for DST.
// DST can encode up to 121 units in either axis for one move.
function pushSafeMove(allStitches, dx, dy, cmd) {
  const MAX_DIST = 121;
  // We'll repeatedly "chop off" a piece of dx,dy until everything fits within DST's limit.
  while (Math.abs(dx) > MAX_DIST || Math.abs(dy) > MAX_DIST) {
    let stepX = Math.max(-MAX_DIST, Math.min(MAX_DIST, dx));
    let stepY = Math.max(-MAX_DIST, Math.min(MAX_DIST, dy));
    allStitches.push([stepX, stepY, cmd]);
    dx -= stepX;
    dy -= stepY;
  }
  // Push whatever's left
  if (dx !== 0 || dy !== 0) {
    allStitches.push([dx, dy, cmd]);
  }
}

// Scale & center polylines to fit into a hoopWidth x hoopHeight rectangle, plus a border.
export function alignPolylinesToHoop(polylines, hoopWidth, hoopHeight, border) {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (let poly of polylines) {
    for (let [x, y] of poly) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  let w = maxX - minX;
  let h = maxY - minY;
  if (w === 0 || h === 0) return polylines;

  // Scale so it fits the hoop minus border
  let scale = Math.min(
    (hoopWidth - border * 2) / w,
    (hoopHeight - border * 2) / h
  );

  // Center about (0,0)
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;

  return polylines.map((poly) =>
    poly.map(([x, y]) => {
      let sx = (x - centerX) * scale;
      let sy = (y - centerY) * scale;
      return [sx, sy];
    })
  );
}

// Builds an ArrayBuffer with the DST data from [{ polylines, color }, ...].
export function exportDST2(data) {
  let allStitches = [];
  let currentX = 0;
  let currentY = 0;
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  // Collect stitches (subdividing large moves so we don't exceed DST's limit).
  for (let i = 0; i < data.length; i++) {
    // Insert a color-change if not the first color block
    if (i > 0) {
      allStitches.push([0, 0, COLOR_CHANGE]);
    }
    let block = data[i];
    for (let poly of block.polylines) {
      if (!poly.length) continue;

      // Jump to first point
      let [px0, py0] = poly[0];
      pushSafeMove(allStitches, px0 - currentX, py0 - currentY, JUMP);
      currentX = px0;
      currentY = py0;
      minX = Math.min(minX, currentX);
      maxX = Math.max(maxX, currentX);
      minY = Math.min(minY, currentY);
      maxY = Math.max(maxY, currentY);

      // Stitch all subsequent points
      for (let s = 1; s < poly.length; s++) {
        let [px, py] = poly[s];
        pushSafeMove(allStitches, px - currentX, py - currentY, STITCH);
        currentX = px;
        currentY = py;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }

  // End of design
  allStitches.push([0, 0, END]);

  // Create a buffer and write 512-byte header
  let out = [];
  const writeByte = (b) => out.push(b & 0xff);
  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      writeByte(str.charCodeAt(i));
    }
  };

  // In a real implementation, you'd fill out name/metadata properly
  let totalStitches = allStitches.length - 1;
  let colorCount = data.length;

  // Minimal DST header
  writeString(`LA:Untitled       \r`);
  writeString(`ST:${String(totalStitches).padStart(7)}\r`);
  writeString(`CO:${String(colorCount).padStart(3)}\r`);
  writeString(`+X:${String(Math.round(Math.max(0, maxX))).padStart(5)}\r`);
  writeString(`-X:${String(Math.round(Math.max(0, -minX))).padStart(5)}\r`);
  writeString(`+Y:${String(Math.round(Math.max(0, maxY))).padStart(5)}\r`);
  writeString(`-Y:${String(Math.round(Math.max(0, -minY))).padStart(5)}\r`);

  // AX/AY final position
  let ax = Math.round(currentX);
  let ay = -Math.round(currentY);
  writeString(`AX:${ax >= 0 ? "+" : "-"}${String(Math.abs(ax)).padStart(5)}\r`);
  writeString(`AY:${ay >= 0 ? "+" : "-"}${String(Math.abs(ay)).padStart(5)}\r`);
  writeString(`MX:+00000\r`);
  writeString(`MY:+00000\r`);
  writeString(`PD:******\r`);

  // End header with ^Z (0x1A), then pad to 512 bytes
  writeByte(0x1a);
  while (out.length < 512) {
    writeByte(0x20);
  }

  // Now encode stitch data
  // We'll use the same "encodeRecord" logic from before, but it won't fail,
  // because pushSafeMove prevents dx, dy from exceeding +/-121.
  function bit(b) {
    return 1 << b;
  }
  function encodeRecord(dx, dy, flags) {
    dy = -dy;
    let b0 = 0,
      b1 = 0,
      b2 = 0;

    // Jump or color-change sets the top bit
    if (flags === JUMP) b2 |= bit(7);
    // DST's color-change is 0b11000011, or we can do the 'standard' approach
    // with bits if it's a normal stitch/jump.
    if (flags === COLOR_CHANGE) {
      return [0x00, 0x00, 0xc3]; // 11000011
    }
    if (flags === END) {
      return [0x00, 0x00, 0xf3]; // 11110011
    }
    // Otherwise, normal stitch or jump
    b2 |= bit(0); // set bits 0
    b2 |= bit(1); // set bits 1

    // X
    if (dx > 40) {
      b2 |= bit(2);
      dx -= 81;
    }
    if (dx < -40) {
      b2 |= bit(3);
      dx += 81;
    }
    if (dx > 13) {
      b1 |= bit(2);
      dx -= 27;
    }
    if (dx < -13) {
      b1 |= bit(3);
      dx += 27;
    }
    if (dx > 4) {
      b0 |= bit(2);
      dx -= 9;
    }
    if (dx < -4) {
      b0 |= bit(3);
      dx += 9;
    }
    if (dx > 1) {
      b1 |= bit(0);
      dx -= 3;
    }
    if (dx < -1) {
      b1 |= bit(1);
      dx += 3;
    }
    if (dx > 0) {
      b0 |= bit(0);
      dx -= 1;
    }
    if (dx < 0) {
      b0 |= bit(1);
      dx += 1;
    }
    if (dx !== 0) throw new Error("X move too large for DST encoding");

    // Y
    if (dy > 40) {
      b2 |= bit(5);
      dy -= 81;
    }
    if (dy < -40) {
      b2 |= bit(4);
      dy += 81;
    }
    if (dy > 13) {
      b1 |= bit(5);
      dy -= 27;
    }
    if (dy < -13) {
      b1 |= bit(4);
      dy += 27;
    }
    if (dy > 4) {
      b0 |= bit(5);
      dy -= 9;
    }
    if (dy < -4) {
      b0 |= bit(4);
      dy += 9;
    }
    if (dy > 1) {
      b1 |= bit(7);
      dy -= 3;
    }
    if (dy < -1) {
      b1 |= bit(6);
      dy += 3;
    }
    if (dy > 0) {
      b0 |= bit(7);
      dy -= 1;
    }
    if (dy < 0) {
      b0 |= bit(6);
      dy += 1;
    }
    if (dy !== 0) throw new Error("Y move too large for DST encoding");

    return [b0, b1, b2];
  }

  // Write out each stitch record
  for (let [dx, dy, cmd] of allStitches) {
    let rec = encodeRecord(dx, dy, cmd);
    writeByte(rec[0]);
    writeByte(rec[1]);
    writeByte(rec[2]);
  }

  return new Uint8Array(out).buffer;
}

/*
HOW TO USE:

1) Align and scale your polylines to the hoop:

   const polylines = [
     [ [0,0], [300,0], [300,300] ],
     // ...
   ];
   const hoopWidth = 130;
   const hoopHeight = 180;
   const border = 5;
   const aligned = alignPolylinesToHoop(polylines, hoopWidth, hoopHeight, border);

2) Export to DST:

   const dstBuffer = exportDST([
     { polylines: aligned, color: '#FF0000' }
   ]);

3) Save or download 'dstBuffer' as a .dst file.
*/
