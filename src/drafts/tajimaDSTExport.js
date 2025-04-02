export function tajimaDSTExport({ data, designName, stitchLength }) {
  designName = designName || "Untitled";
  stitchLength = stitchLength || 3;

  let expArr = [];

  // Round all input data to tenths of millimeters
  data = data.map((block) => ({
    ...block,
    polylines: block.polylines.map((polyline) =>
      polyline.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)])
    ),
  }));

  // We'll accumulate: { dx, dy, type }, type can be 'jump', 'color', 'end', or undefined for normal stitch
  let moves = [];
  let currentX = 0;
  let currentY = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Subdivide moves bigger than ±121 DST units
  function pushMove(dx, dy, type) {
    moves.push({ dx: 0, dy: 0, type });

    // A single move might still exceed ±121, so break it up
    const limit = stitchLength * 10;

    // Use Bresenham-like algorithm for movement
    while (Math.abs(dx) > limit || Math.abs(dy) > limit) {
      // Calculate the dominant axis and its step
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const isXDominant = absX > absY;

      // Calculate step size for dominant axis
      const step = Math.min(limit, isXDominant ? absX : absY);
      const signX = Math.sign(dx);
      const signY = Math.sign(dy);

      // Calculate the ratio for the non-dominant axis using integer math
      const ratio = isXDominant
        ? Math.round((absY * 100) / absX)
        : Math.round((absX * 100) / absY);
      const nonDominantStep = Math.round((step * ratio) / 100);

      // Apply the movement
      const stepX = isXDominant ? step * signX : nonDominantStep * signX;
      const stepY = isXDominant ? nonDominantStep * signY : step * signY;

      moves.push({ dx: stepX, dy: stepY, type });
      dx -= stepX;
      dy -= stepY;
    }

    if (dx !== 0 || dy !== 0) {
      moves.push({ dx, dy, type });
    }
  }

  // Track actual DST bounding box for the header
  function trackBounds(x, y) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
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
          pushMove(x - currentX, y - currentY, "jump");
          currentX = x;
          currentY = y;
          trackBounds(currentX, currentY);
        } else {
          pushMove(x - currentX, y - currentY);
          currentX = x;
          currentY = y;
          trackBounds(currentX, currentY);
        }
      });
    }
  }
  // End of design
  moves.push({ dx: 0, dy: 0, type: "end" });

  // Count stitches for the header (exclude color, jump, and end)
  let totalStitches = moves.filter(
    (m) => m.type === undefined && (m.dx !== 0 || m.dy !== 0)
  ).length;

  // Current final position
  let ax = currentX;
  let ay = -currentY;

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

  writeString(`LA:${designName.slice(0, 16)}\r`);
  writeString(`ST:${padNumber(totalStitches, 7)}\r`);
  // We approximate color count = number of blocks
  let colorCount = data.length;
  writeString(`CO:${padNumber(colorCount, 3)}\r`);
  writeString(`+X:${padNumber(Math.max(0, maxX), 5)}\r`);
  writeString(`-X:${padNumber(Math.max(0, -minX), 5)}\r`);
  writeString(`+Y:${padNumber(Math.max(0, maxY), 5)}\r`);
  writeString(`-Y:${padNumber(Math.max(0, -minY), 5)}\r`);
  writeString(`AX:${ax >= 0 ? "+" : "-"}${padNumber(Math.abs(ax), 5)}\r`);
  writeString(`AY:${ay >= 0 ? "+" : "-"}${padNumber(Math.abs(ay), 5)}\r`);
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
function encodeDSTRecord(dx, dy, type = "stitch") {
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
