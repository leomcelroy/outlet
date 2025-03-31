export function tajimaDSTExport(data, designName) {
  let expArr = [];

  // We'll accumulate: { dx, dy, type }, type can be 'jump', 'color', 'end', or undefined for normal stitch
  let moves = [];
  let currentXmm = 0;
  let currentYmm = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Subdivide moves bigger than ±121 DST units
  function pushMove(dxMm, dyMm, type) {
    moves.push({ dx: 0, dy: 0, type });
    // Convert mm -> DST (multiply by 10 and round)
    let dxDST = Math.round(dxMm * 10);
    let dyDST = Math.round(dyMm * 10);

    // A single move might still exceed ±121, so break it up
    const limit = 30;
    while (Math.abs(dxDST) > limit || Math.abs(dyDST) > limit) {
      let stepX = Math.max(-limit, Math.min(limit, dxDST));
      let stepY = Math.max(-limit, Math.min(limit, dyDST));
      moves.push({ dx: stepX, dy: stepY, type });
      dxDST -= stepX;
      dyDST -= stepY;
    }
    if (dxDST !== 0 || dyDST !== 0) {
      moves.push({ dx: dxDST, dy: dyDST, type });
    }
  }

  // Track actual DST bounding box for the header
  function trackBounds(xMm, yMm) {
    if (xMm < minX) minX = xMm;
    if (xMm > maxX) maxX = xMm;
    if (yMm < minY) minY = yMm;
    if (yMm > maxY) maxY = yMm;
  }

  // Generate moves
  for (let i = 0; i < data.length; i++) {
    // Color change between blocks
    if (i > 0) {
      moves.push({ dx: 0, dy: 0, type: "color" });
    }

    let block = data[i];
    for (let poly of block.polylines) {
      poly.forEach(([x, y], i) => {
        if (i === 0) {
          pushMove(x - currentXmm, y - currentYmm, "jump");
          currentXmm = x;
          currentYmm = y;
          trackBounds(currentXmm, currentYmm);
        } else {
          pushMove(x - currentXmm, y - currentYmm);
          currentXmm = x;
          currentYmm = y;
          trackBounds(currentXmm, currentYmm);
        }
      });
    }

    console.log({ moves, block });
  }
  // End of design
  moves.push({ dx: 0, dy: 0, type: "end" });

  // Count stitches for the header (exclude color, jump, and end)
  let totalStitches = moves.filter(
    (m) => m.type === undefined && (m.dx !== 0 || m.dy !== 0)
  ).length;

  // Convert bounding box from mm -> DST
  let minXDST = Math.round(minX * 10);
  let maxXDST = Math.round(maxX * 10);
  let minYDST = Math.round(minY * 10);
  let maxYDST = Math.round(maxY * 10);

  // Current final position in DST
  let axDST = Math.round(currentXmm * 10);
  let ayDST = -Math.round(currentYmm * 10);

  // Write 512-byte header
  function writeByte(b) {
    expArr.push(b & 0xff);
  }
  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      writeByte(s.charCodeAt(i));
    }
  }
  function padNumber(n, width) {
    const s = String(n);
    return s.length >= width ? s : " ".repeat(width - s.length) + s;
  }

  writeString(`LA:${(designName || "Untitled").slice(0, 16)}\r`);
  writeString(`ST:${padNumber(totalStitches, 7)}\r`);
  // We approximate color count = number of blocks
  let colorCount = data.length;
  writeString(`CO:${padNumber(colorCount, 3)}\r`);
  writeString(`+X:${padNumber(Math.max(0, maxXDST), 5)}\r`);
  writeString(`-X:${padNumber(Math.max(0, -minXDST), 5)}\r`);
  writeString(`+Y:${padNumber(Math.max(0, maxYDST), 5)}\r`);
  writeString(`-Y:${padNumber(Math.max(0, -minYDST), 5)}\r`);
  writeString(`AX:${axDST >= 0 ? "+" : "-"}${padNumber(Math.abs(axDST), 5)}\r`);
  writeString(`AY:${ayDST >= 0 ? "+" : "-"}${padNumber(Math.abs(ayDST), 5)}\r`);
  writeString(`MX:+00000\r`);
  writeString(`MY:+00000\r`);
  writeString(`PD:******\r`);
  // ^Z
  writeByte(0x1a);
  // Pad up to 512
  while (expArr.length < 512) {
    writeByte(0x20);
  }

  // Stitch data
  for (let { dx, dy, type } of moves) {
    const record = encodeDSTRecord(dx, dy, type);
    writeByte(record[0]);
    writeByte(record[1]);
    writeByte(record[2]);
  }

  return new Uint8Array(expArr);
}

/*
Encode a single move in DST format. 
We've already limited dx, dy to ±121, so this should never fail.
*/
function encodeDSTRecord(dx, dy, type) {
  // DST inverts Y
  dy = -dy;

  let b0 = 0,
    b1 = 0,
    b2 = 0;
  function bit(n) {
    return 1 << n;
  }

  // Color change
  if (type === "color") {
    return [0, 0, 0xc3]; // 11000011 in binary
  }
  // End of design
  if (type === "end") {
    return [0, 0, 0xf3]; // 11110011 in binary
  }
  // Jump => set top bit (bit7 of b2)
  if (type === "jump") {
    b2 |= bit(7);
  }
  // Set bits 0 and 1 for any normal move
  b2 |= bit(0);
  b2 |= bit(1);

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
  if (dx !== 0) throw new Error("X move too large after subdividing");

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
  if (dy !== 0) throw new Error("Y move too large after subdividing");

  return [b0, b1, b2];
}
