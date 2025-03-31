const STITCH = 0;
const JUMP = 1;
const COLOR_CHANGE = 5;
const END = 4;

function bit(b) {
  return 1 << b;
}

function encodeRecord(dx, dy, command) {
  // DST format inverts Y
  dy = -dy;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  // Jump or Color Change sets upper bits
  if (command === JUMP) b2 |= bit(7);
  if (command === STITCH || command === JUMP || command === COLOR_CHANGE) {
    b2 |= bit(0);
    b2 |= bit(1);

    // Encode X
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
    if (dx !== 0) {
      throw new Error("X move too large for DST encoding");
    }

    // Encode Y
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
    if (dy !== 0) {
      throw new Error("Y move too large for DST encoding");
    }
  } else if (command === COLOR_CHANGE) {
    b2 = 0b11000011;
  }

  // Actual color change or stop in DST is 0b11000011
  if (command === COLOR_CHANGE) {
    b2 = 0b11000011;
  }
  // End of file
  if (command === END) {
    b2 = 0b11110011;
  }

  return [b0, b1, b2];
}

export function exportDST(data) {
  // data: [ { polylines: [ [ [x, y], ... ], ... ], color: '#RRGGBB' }, ... ]

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let allStitches = [];
  let currentX = 0;
  let currentY = 0;

  // Build stitch list
  for (let i = 0; i < data.length; i++) {
    // Color change between objects
    if (i > 0) {
      allStitches.push([0, 0, COLOR_CHANGE]);
    }

    const obj = data[i];
    for (let poly of obj.polylines) {
      if (!poly.length) continue;
      // Jump to first point
      let [x0, y0] = poly[0];
      allStitches.push([x0 - currentX, y0 - currentY, JUMP]);
      currentX = x0;
      currentY = y0;
      minX = Math.min(minX, x0);
      maxX = Math.max(maxX, x0);
      minY = Math.min(minY, y0);
      maxY = Math.max(maxY, y0);

      for (let s = 1; s < poly.length; s++) {
        let [x, y] = poly[s];
        allStitches.push([x - currentX, y - currentY, STITCH]);
        currentX = x;
        currentY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // End of file
  allStitches.push([0, 0, END]);

  // Header data
  let totalStitches = allStitches.length - 1;
  let colorCount = data.length;

  // Build output buffer
  // A typical DST header is 512 bytes, then stitch data follows.
  let out = [];
  const writeByte = (b) => out.push(b & 0xff);
  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      writeByte(str.charCodeAt(i));
    }
  };

  // Basic header
  writeString(`LA:Untitled       \r`);
  writeString(`ST:${String(totalStitches).padStart(7)}\r`);
  writeString(`CO:${String(colorCount).padStart(3)}\r`);
  writeString(`+X:${String(Math.round(Math.max(0, maxX))).padStart(5)}\r`);
  writeString(`-X:${String(Math.round(Math.max(0, -minX))).padStart(5)}\r`);
  writeString(`+Y:${String(Math.round(Math.max(0, maxY))).padStart(5)}\r`);
  writeString(`-Y:${String(Math.round(Math.max(0, -minY))).padStart(5)}\r`);

  // AX / AY is final machine position
  let ax = Math.round(currentX);
  let ay = -Math.round(currentY);
  writeString(`AX:${ax >= 0 ? "+" : "-"}${String(Math.abs(ax)).padStart(5)}\r`);
  writeString(`AY:${ay >= 0 ? "+" : "-"}${String(Math.abs(ay)).padStart(5)}\r`);

  // Machine defaults
  writeString(`MX:+00000\r`);
  writeString(`MY:+00000\r`);
  writeString(`PD:******\r`);

  // End of header
  writeByte(0x1a);

  // Pad to 512
  while (out.length < 512) {
    writeByte(0x20);
  }

  // Write stitches
  for (let s of allStitches) {
    let [dx, dy, cmd] = s;
    let rec = encodeRecord(dx, dy, cmd);
    writeByte(rec[0]);
    writeByte(rec[1]);
    writeByte(rec[2]);
  }

  return new Uint8Array(out).buffer;
}
