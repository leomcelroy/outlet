// Constants
const PES_VERSION_1_SIGNATURE = "#PES0001";
const PES_VERSION_6_SIGNATURE = "#PES0060";
const EMB_ONE = "CEmbOne";
const EMB_SEG = "CSewSeg";

const COMMAND_MASK = 0x000000ff;
const STITCH = 0;
const JUMP = 1;
const COLOR_CHANGE = 5;

const COLOR_TABLE = [
  0x1a0a94, 0x0f75ff, 0x00934c, 0xbabdfe, 0xec0000, 0xe4995a, 0xcc48ab,
  0xfdc4fa, 0xdd84cd, 0x6bd38a, 0xe4a945, 0xffbd42, 0xffe600, 0x6cd900,
  0xc1a941, 0xb5ad97, 0xba9c5f, 0xfaf59e, 0x808080, 0x000000, 0x001cdf,
  0xdf00b8, 0x626262, 0x69260d, 0xff0060, 0xbf8200, 0xf39178, 0xff6805,
  0xf0f0f0, 0xc832cd, 0xb0bf9b, 0x65bfeb, 0xffba04, 0xfff06c, 0xfeca15,
  0xf38101, 0x37a923, 0x23465f, 0xa6a695, 0xcebfa6, 0x96aa02, 0xffe3c6,
  0xff99d7, 0x007004, 0xedccfb, 0xc089d8, 0xe7d9b4, 0xe90e86, 0xcf6829,
  0x408615, 0xdb1797, 0xffa704, 0xb9ffff, 0x228927, 0xb612cd, 0x00aa00,
  0xfea9dc, 0xfed510, 0x0097df, 0xffff84, 0xcfe774, 0xffc864, 0xffc8c8,
  0xffc8c8,
];

function writeInt8(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  return offset + 1;
}

function writeInt16LE(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
  return offset + 2;
}

function writeInt24LE(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
  buffer[offset + 2] = (value >> 16) & 0xff;
  return offset + 3;
}

function writeInt32LE(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
  buffer[offset + 2] = (value >> 16) & 0xff;
  buffer[offset + 3] = (value >> 24) & 0xff;
  return offset + 4;
}

function writeFloat32LE(buffer, offset, value) {
  const view = new DataView(buffer.buffer);
  view.setFloat32(offset, value, true);
  return offset + 4;
}

function writeString(buffer, offset, str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  buffer.set(bytes, offset);
  return offset + bytes.length;
}

function findColor(rgb) {
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < COLOR_TABLE.length; i++) {
    const rr = (COLOR_TABLE[i] >> 16) & 0xff;
    const gg = (COLOR_TABLE[i] >> 8) & 0xff;
    const bb = COLOR_TABLE[i] & 0xff;
    const dist =
      (r - rr) * (r - rr) + (g - gg) * (g - gg) + (b - bb) * (b - bb);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex + 1;
}

function writePesString8(buffer, offset, str) {
  if (!str) {
    return writeInt8(buffer, offset, 0);
  }
  if (str.length > 255) {
    str = str.substring(0, 255);
  }
  offset = writeInt8(buffer, offset, str.length);
  return writeString(buffer, offset, str);
}

function writePesString16(buffer, offset, str) {
  if (!str) {
    return writeInt16LE(buffer, offset, 0);
  }
  offset = writeInt16LE(buffer, offset, str.length);
  return writeString(buffer, offset, str);
}

function writePesThread(buffer, offset, thread) {
  offset = writePesString8(buffer, offset, thread.catalogNumber);
  offset = writeInt8(buffer, offset, (thread.color >> 16) & 0xff);
  offset = writeInt8(buffer, offset, (thread.color >> 8) & 0xff);
  offset = writeInt8(buffer, offset, thread.color & 0xff);
  offset = writeInt8(buffer, offset, 0);
  offset = writeInt32LE(buffer, offset, 0xa);
  offset = writePesString8(buffer, offset, thread.description);
  offset = writePesString8(buffer, offset, thread.brand);
  offset = writePesString8(buffer, offset, thread.chart);
  return offset;
}

function writePesHeaderV1(buffer, offset, options) {
  offset = writeInt16LE(buffer, offset, options.scaleToFit ? 1 : 0);
  offset = writeInt16LE(buffer, offset, 1);
  offset = writeInt16LE(buffer, offset, 1);
  return offset;
}

function writePesHeaderV6(buffer, offset, options) {
  offset = writeInt16LE(buffer, offset, 1);
  offset = writeString(buffer, offset, "06"); // changed from "02" to "06"
  offset = writePesString8(buffer, offset, options.title);
  offset = writePesString8(buffer, offset, "");
  offset = writePesString8(buffer, offset, "");
  offset = writePesString8(buffer, offset, "");
  offset = writePesString8(buffer, offset, "");
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, options.hoopWidth);
  offset = writeInt16LE(buffer, offset, options.hoopHeight);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, options.width || 200);
  offset = writeInt16LE(buffer, offset, options.height || 200);
  offset = writeInt16LE(buffer, offset, options.hoopWidth);
  offset = writeInt16LE(buffer, offset, options.hoopHeight);
  offset = writeInt16LE(buffer, offset, 100);
  offset = writeInt16LE(buffer, offset, 7);
  offset = writeInt16LE(buffer, offset, 19);
  offset = writeInt16LE(buffer, offset, 1);
  offset = writeInt16LE(buffer, offset, 1);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, 100);
  offset = writeInt16LE(buffer, offset, 1);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt8(buffer, offset, 0);
  offset = writeFloat32LE(buffer, offset, 1);
  offset = writeFloat32LE(buffer, offset, 0);
  offset = writeFloat32LE(buffer, offset, 0);
  offset = writeFloat32LE(buffer, offset, 1);
  offset = writeFloat32LE(buffer, offset, 0);
  offset = writeFloat32LE(buffer, offset, 0);
  const threadCount = options.polylines.length;
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, 0);
  offset = writeInt16LE(buffer, offset, threadCount);
  for (let i = 0; i < threadCount; i++) {
    offset = writePesThread(buffer, offset, {
      color: options.polylines[i].color,
      catalogNumber: "",
      description: "",
      brand: "",
      chart: "",
    });
  }
  offset = writeInt16LE(buffer, offset, 1);
  return offset;
}

function writePecGraph(buffer, offset) {
  const graphData = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f,
    0x08, 0x00, 0x00, 0x00, 0x00, 0x10, 0x04, 0x00, 0x00, 0x00, 0x00, 0x20,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
    0x04, 0x00, 0x00, 0x00, 0x00, 0x20, 0x08, 0x00, 0x00, 0x00, 0x00, 0x10,
    0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];
  buffer.set(graphData, offset);
  return offset + graphData.length;
}

function encodeLongForm(value) {
  value &= 0x0fff;
  value |= 0x8000;
  return value;
}

function flagTrim(longForm) {
  return longForm | (0x20 << 8);
}

// Changed this so color changes always write FE B0 01
function writePecStitches(buffer, offset, stitches) {
  let xx = 0,
    yy = 0;
  for (let i = 0; i < stitches.length; i++) {
    if (i > 0 && stitches[i].color !== stitches[i - 1].color) {
      offset = writeInt8(buffer, offset, 0xfe);
      offset = writeInt8(buffer, offset, 0xb0);
      offset = writeInt8(buffer, offset, 0x01);
    }
    let dx = Math.round(stitches[i].x - xx);
    let dy = Math.round(stitches[i].y - yy);
    xx += dx;
    yy += dy;
    if (i === 0) {
      dx = encodeLongForm(dx);
      dx = flagTrim(dx);
      dy = encodeLongForm(dy);
      dy = flagTrim(dy);
      offset = writeInt16LE(buffer, offset, dx);
      offset = writeInt16LE(buffer, offset, dy);
      offset = writeInt8(buffer, offset, 0);
      offset = writeInt8(buffer, offset, 0);
      dx = 0;
      dy = 0;
    }
    if (dx < 63 && dx > -64 && dy < 63 && dy > -64) {
      offset = writeInt8(buffer, offset, dx & 0x7f);
      offset = writeInt8(buffer, offset, dy & 0x7f);
    } else {
      dx = encodeLongForm(dx);
      dy = encodeLongForm(dy);
      offset = writeInt16LE(buffer, offset, dx);
      offset = writeInt16LE(buffer, offset, dy);
    }
  }
  offset = writeInt8(buffer, offset, 0xff);
  return offset;
}

function writePecBlock(buffer, offset, stitches, bounds) {
  const width = Math.round(bounds[2] - bounds[0]);
  const height = Math.round(bounds[3] - bounds[1]);
  const startPos = offset;
  offset = writeInt8(buffer, offset, 0);
  offset = writeInt8(buffer, offset, 0);
  const lengthOffset = offset;
  offset = writeInt24LE(buffer, offset, 0);
  offset = writeInt8(buffer, offset, 0x31);
  offset = writeInt8(buffer, offset, 0xff);
  offset = writeInt8(buffer, offset, 0xf0);
  offset = writeInt16LE(buffer, offset, width);
  offset = writeInt16LE(buffer, offset, height);
  offset = writeInt16LE(buffer, offset, 0x1e0);
  offset = writeInt16LE(buffer, offset, 0x1b0);
  offset = writeInt16LE(buffer, offset, 0x9000 | -Math.round(bounds[0]));
  offset = writeInt16LE(buffer, offset, 0x9000 | -Math.round(bounds[1]));
  offset = writePecStitches(buffer, offset, stitches);
  const blockLen = offset - startPos;
  offset = lengthOffset;
  offset = writeInt24LE(buffer, offset, blockLen);
  offset = startPos + blockLen;
  return offset;
}

function writePecHeaderBlock(buffer, offset, title, stitches) {
  const colorBreaks = [];
  for (let i = 0; i < stitches.length; i++) {
    if (i === 0 || stitches[i].color !== stitches[i - 1].color) {
      colorBreaks.push(stitches[i].color);
    }
  }
  offset = writeString(buffer, offset, "LA:" + title.padEnd(16, " ") + "\r");
  for (let i = 0; i < 12; i++) {
    offset = writeInt8(buffer, offset, 0x20);
  }
  offset = writeInt8(buffer, offset, 0xff);
  offset = writeInt8(buffer, offset, 0x00);
  offset = writeInt8(buffer, offset, 48 / 8);
  offset = writeInt8(buffer, offset, 38);
  for (let i = 0; i < 12; i++) {
    offset = writeInt8(buffer, offset, 0x20);
  }
  offset = writeInt8(buffer, offset, colorBreaks.length - 1);
  const colorIndexList = [colorBreaks.length - 1];
  for (const clr of colorBreaks) {
    const idx = findColor(clr);
    colorIndexList.push(idx);
    offset = writeInt8(buffer, offset, idx);
  }
  for (let i = 0; i < 463 - colorBreaks.length; i++) {
    offset = writeInt8(buffer, offset, 0x20);
  }
  return [offset, colorIndexList, colorBreaks];
}

function writePecGraphicsBlock(buffer, offset, stitches) {
  offset = writePecGraph(buffer, offset);
  offset = writePecGraph(buffer, offset);
  for (let i = 1; i < stitches.length; i++) {
    if (stitches[i].color !== stitches[i - 1].color) {
      offset = writePecGraph(buffer, offset);
    }
  }
  return offset;
}

function writePec(buffer, offset, title, stitches, bounds) {
  const [newOffset, colorIndexList, palette] = writePecHeaderBlock(
    buffer,
    offset,
    title,
    stitches
  );
  offset = newOffset;
  offset = writePecBlock(buffer, offset, stitches, bounds);
  offset = writePecGraphicsBlock(buffer, offset, stitches);
  return [offset, [colorIndexList, palette]];
}

function writePesAddendum(buffer, offset, colorInfo) {
  const [colorIndexList, palette] = colorInfo;
  for (let i = 0; i < colorIndexList.length; i++) {
    offset = writeInt8(buffer, offset, colorIndexList[i]);
  }
  for (let i = colorIndexList.length; i < 128; i++) {
    offset = writeInt8(buffer, offset, 0x20);
  }
  for (let i = 0; i < palette.length; i++) {
    for (let j = 0; j < 0x90; j++) {
      offset = writeInt8(buffer, offset, 0x00);
    }
  }
  for (const c of palette) {
    offset = writeInt24LE(buffer, offset, c);
  }
  return offset;
}

export function writePes(polylines, options = {}) {
  let version = options.version === 6 ? 6 : 1;
  let truncated = !!options.truncated;
  let title =
    typeof options.designName === "string" ? options.designName : "Design";
  let hoopWidth =
    typeof options.hoopWidth === "number" ? options.hoopWidth : 130;
  let hoopHeight =
    typeof options.hoopHeight === "number" ? options.hoopHeight : 180;
  let scaleToFit = !!options.scaleToFit;
  let centerInHoop = !!options.centerInHoop;
  let rawStitches = [];
  let rawColors = [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (let block of polylines) {
    let c = block.color >>> 0;
    for (let line of block.polylines) {
      for (let i = 0; i < line.length; i++) {
        let x = line[i][0];
        let y = line[i][1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        rawStitches.push([x, y]);
        rawColors.push(c);
      }
    }
  }

  let designWidth = maxX - minX;
  let designHeight = maxY - minY;
  let scale = 1;
  if (scaleToFit && designWidth > 0 && designHeight > 0) {
    let sx = hoopWidth / designWidth;
    let sy = hoopHeight / designHeight;
    scale = Math.min(sx, sy);
  }
  let midX = (minX + maxX) / 2;
  let midY = (minY + maxY) / 2;

  let scaledStitches = [];
  let scaledColors = [];
  let newMinX = Infinity,
    newMinY = Infinity,
    newMaxX = -Infinity,
    newMaxY = -Infinity;
  for (let i = 0; i < rawStitches.length; i++) {
    let rx = rawStitches[i][0];
    let ry = rawStitches[i][1];
    let nx = (rx - midX) * scale;
    let ny = (ry - midY) * scale;
    if (centerInHoop) {
      nx += hoopWidth / 2;
      ny += hoopHeight / 2;
    }
    scaledStitches.push([nx, ny]);
    scaledColors.push(rawColors[i]);
    if (nx < newMinX) newMinX = nx;
    if (ny < newMinY) newMinY = ny;
    if (nx > newMaxX) newMaxX = nx;
    if (ny > newMaxY) newMaxY = ny;
  }
  let bounds = [newMinX, newMinY, newMaxX, newMaxY];
  const bufferSize = 8 * 1024 * 1024;
  const buffer = new Uint8Array(bufferSize);
  let offset = 0;
  const stitchData = [];
  for (let i = 0; i < scaledStitches.length; i++) {
    stitchData.push({
      x: scaledStitches[i][0],
      y: scaledStitches[i][1],
      color: scaledColors[i],
    });
  }
  if (version === 1) {
    if (truncated) {
      offset = writeString(buffer, offset, PES_VERSION_1_SIGNATURE);
      offset = writeInt8(buffer, offset, 0x16);
      for (let i = 0; i < 13; i++) {
        offset = writeInt8(buffer, offset, 0x00);
      }
      const [newOffset] = writePec(buffer, offset, title, stitchData, bounds);
      offset = newOffset;
    } else {
      offset = writeString(buffer, offset, PES_VERSION_1_SIGNATURE);
      const lengthOffset = offset;
      offset = writeInt32LE(buffer, offset, 0);
      if (!stitchData.length) {
        offset = writePesHeaderV1(buffer, offset, { scaleToFit });
        offset = writeInt16LE(buffer, offset, 0);
        offset = writeInt16LE(buffer, offset, 0);
      } else {
        offset = writePesHeaderV1(buffer, offset, { scaleToFit });
        offset = writeInt16LE(buffer, offset, 0xffff);
        offset = writeInt16LE(buffer, offset, 0);
        const [newOffset] = writePec(buffer, offset, title, stitchData, bounds);
        offset = newOffset;
      }
      const currentOffset = offset;
      offset = lengthOffset;
      offset = writeInt32LE(buffer, offset, currentOffset);
      offset = currentOffset;
    }
  } else {
    if (truncated) {
      offset = writeString(buffer, offset, PES_VERSION_6_SIGNATURE);
      const lengthOffset = offset;
      offset = writeInt32LE(buffer, offset, 0);
      offset = writePesHeaderV6(buffer, offset, {
        title,
        hoopWidth,
        hoopHeight,
        scaleToFit,
        width: designWidth,
        height: designHeight,
        polylines,
      });
      for (let i = 0; i < 5; i++) {
        offset = writeInt8(buffer, offset, 0);
      }
      offset = writeInt16LE(buffer, offset, 0);
      offset = writeInt16LE(buffer, offset, 0);
      const currentOffset = offset;
      offset = lengthOffset;
      offset = writeInt32LE(buffer, offset, currentOffset);
      offset = currentOffset;
      const [newOffset, colorInfo] = writePec(
        buffer,
        offset,
        title,
        stitchData,
        bounds
      );
      offset = newOffset;
      offset = writePesAddendum(buffer, offset, colorInfo);
      offset = writeInt16LE(buffer, offset, 0);
    } else {
      offset = writeString(buffer, offset, PES_VERSION_6_SIGNATURE);
      const lengthOffset = offset;
      offset = writeInt32LE(buffer, offset, 0);
      if (!stitchData.length) {
        offset = writePesHeaderV6(buffer, offset, {
          title,
          hoopWidth,
          hoopHeight,
          scaleToFit,
          width: designWidth,
          height: designHeight,
          polylines,
        });
        offset = writeInt16LE(buffer, offset, 0);
        offset = writeInt16LE(buffer, offset, 0);
      } else {
        offset = writePesHeaderV6(buffer, offset, {
          title,
          hoopWidth,
          hoopHeight,
          scaleToFit,
          width: designWidth,
          height: designHeight,
          polylines,
        });
        offset = writeInt16LE(buffer, offset, 0xffff);
        offset = writeInt16LE(buffer, offset, 0);
        const [newOffset, colorInfo] = writePec(
          buffer,
          offset,
          title,
          stitchData,
          bounds
        );
        offset = newOffset;
        offset = writePesAddendum(buffer, offset, colorInfo);
        offset = writeInt16LE(buffer, offset, 0);
      }
      const currentOffset = offset;
      offset = lengthOffset;
      offset = writeInt32LE(buffer, offset, currentOffset);
      offset = currentOffset;
    }
  }
  return buffer.slice(0, offset);
}
