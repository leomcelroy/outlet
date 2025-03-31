export function polylinesToPes(polylines, options = {}) {
  // Options
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

  console.log({
    version,
    truncated,
    title,
    hoopWidth,
    hoopHeight,
    scaleToFit,
    centerInHoop,
  });

  // Gather stitches and colors from polylines
  let rawStitches = [];
  let rawColors = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

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

  // Transform (scale + center) if requested
  // We treat the bounding box of the entire design in user-space,
  // and transform it so it fits and/or is centered in the hoop.
  let designWidth = maxX - minX;
  let designHeight = maxY - minY;

  let scale = 1;
  if (scaleToFit && designWidth > 0 && designHeight > 0) {
    let sx = hoopWidth / designWidth;
    let sy = hoopHeight / designHeight;
    scale = Math.min(sx, sy);
  }

  // Centering in the hoop means we want the design's center to be at (hoopWidth/2, hoopHeight/2).
  // The bounding box center in raw space is midX, midY.
  let midX = (minX + maxX) / 2;
  let midY = (minY + maxY) / 2;

  // Transform each point
  // After transform, we recalc new bounding box for final writing.
  let scaledStitches = [];
  let scaledColors = [];
  let newMinX = Infinity;
  let newMinY = Infinity;
  let newMaxX = -Infinity;
  let newMaxY = -Infinity;

  for (let i = 0; i < rawStitches.length; i++) {
    let rx = rawStitches[i][0];
    let ry = rawStitches[i][1];

    // Shift so that raw center is at (0,0), then scale, then shift to hoop center if needed
    let nx = (rx - midX) * scale;
    let ny = (ry - midY) * scale;
    if (centerInHoop) {
      nx += hoopWidth / 2;
      ny += hoopHeight / 2;
    }

    if (nx < newMinX) newMinX = nx;
    if (ny < newMinY) newMinY = ny;
    if (nx > newMaxX) newMaxX = nx;
    if (ny > newMaxY) newMaxY = ny;
    scaledStitches.push([nx, ny]);
    scaledColors.push(rawColors[i]);
  }

  let bounds = [newMinX, newMinY, newMaxX, newMaxY];

  // Allocate large buffer for writing
  let bufferSize = 8 * 1024 * 1024;
  let buffer = new ArrayBuffer(bufferSize);
  let dv = new DataView(buffer);
  let position = 0;

  function tell() {
    return position;
  }
  function seek(pos) {
    position = pos;
  }
  function writeInt8(value) {
    dv.setUint8(position, value & 0xff);
    position += 1;
  }
  function writeInt16LE(value) {
    dv.setUint16(position, value & 0xffff, true);
    position += 2;
  }
  function writeInt16BE(value) {
    dv.setUint16(position, value & 0xffff, false);
    position += 2;
  }
  function writeInt24LE(value) {
    dv.setUint8(position, value & 0xff);
    position++;
    dv.setUint8(position, (value >> 8) & 0xff);
    position++;
    dv.setUint8(position, (value >> 16) & 0xff);
    position++;
  }
  function writeInt32LE(value) {
    dv.setUint32(position, value >>> 0, true);
    position += 4;
  }
  function writeString(str) {
    for (let i = 0; i < str.length; i++) {
      dv.setUint8(position, str.charCodeAt(i));
      position++;
    }
  }
  function writeBytes(arr) {
    for (let i = 0; i < arr.length; i++) {
      writeInt8(arr[i]);
    }
  }
  function writePesString8(str) {
    if (!str) {
      writeInt8(0);
      return;
    }
    if (str.length > 255) str = str.substring(0, 255);
    writeInt8(str.length);
    writeString(str);
  }
  function writePesString16(str) {
    writeInt16LE(str.length);
    writeString(str);
  }

  let placeStack = [];
  function spaceHolder(count) {
    let startPos = tell();
    for (let i = 0; i < count; i++) {
      writeInt8(0);
    }
    placeStack.push([startPos, count]);
  }
  function writeSpaceHolder16LE(value) {
    let top = placeStack.pop();
    let savedPos = tell();
    seek(top[0]);
    writeInt16LE(value);
    seek(savedPos);
  }
  function writeSpaceHolder24LE(value) {
    let top = placeStack.pop();
    let savedPos = tell();
    seek(top[0]);
    writeInt24LE(value);
    seek(savedPos);
  }
  function writeSpaceHolder32LE(value) {
    let top = placeStack.pop();
    let savedPos = tell();
    seek(top[0]);
    writeInt32LE(value);
    seek(savedPos);
  }

  let MASK_07_BIT = 0x7f;
  let JUMP_CODE = 0x10;
  let TRIM_CODE = 0x20;
  let FLAG_LONG = 0x80;
  let PEC_ICON_WIDTH = 48;
  let PEC_ICON_HEIGHT = 38;

  function findColor(rgb) {
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = rgb & 0xff;
    let table = [
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
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < table.length; i++) {
      let rr = (table[i] >> 16) & 0xff;
      let gg = (table[i] >> 8) & 0xff;
      let bb = table[i] & 0xff;
      let dist =
        (r - rr) * (r - rr) + (g - gg) * (g - gg) + (b - bb) * (b - bb);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex + 1;
  }

  function encodeLongForm(value) {
    value &= 0x0fff;
    value |= 0x8000;
    return value;
  }
  function flagTrim(longForm) {
    return longForm | (TRIM_CODE << 8);
  }

  function floatToBits(f) {
    let b = new ArrayBuffer(4);
    let dv2 = new DataView(b);
    dv2.setFloat32(0, f, true);
    return dv2.getUint32(0, true);
  }

  function writePecGraph() {
    writeBytes([
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
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x04, 0x00, 0x00, 0x00, 0x00, 0x20, 0x08, 0x00, 0x00, 0x00, 0x00, 0x10,
      0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
  }

  function writePecBlock(data) {
    let width = Math.round(bounds[2] - bounds[0]);
    let height = Math.round(bounds[3] - bounds[1]);
    let startPos = tell();
    writeInt8(0);
    writeInt8(0);
    spaceHolder(3);
    writeInt8(0x31);
    writeInt8(0xff);
    writeInt8(0xf0);
    writeInt16LE(width);
    writeInt16LE(height);
    writeInt16LE(0x1e0);
    writeInt16LE(0x1b0);
    // No random offset. Just offset to the negative min bounds so it's properly placed
    writeInt16BE(0x9000 | -Math.round(bounds[0]));
    writeInt16BE(0x9000 | -Math.round(bounds[1]));
    writePecStitches(data);
    let blockLength = tell() - startPos;
    writeSpaceHolder24LE(blockLength);
  }

  function writePecStitches(data) {
    let colorFlip = true;
    let xx = 0;
    let yy = 0;
    for (let i = 0; i < data.length; i++) {
      if (i > 0 && data[i].color !== data[i - 1].color) {
        writeInt8(0xfe);
        writeInt8(0xb0);
        writeInt8(colorFlip ? 2 : 1);
        colorFlip = !colorFlip;
      }
      let dx = Math.round(data[i].x - xx);
      let dy = Math.round(data[i].y - yy);
      xx += dx;
      yy += dy;
      if (i === 0) {
        dx = encodeLongForm(dx);
        dx = flagTrim(dx);
        dy = encodeLongForm(dy);
        dy = flagTrim(dy);
        writeInt16BE(dx);
        writeInt16BE(dy);
        writeInt8(0);
        writeInt8(0);
        dx = 0;
        dy = 0;
      }
      if (dx < 63 && dx > -64 && dy < 63 && dy > -64) {
        writeInt8(dx & MASK_07_BIT);
        writeInt8(dy & MASK_07_BIT);
      } else {
        dx = encodeLongForm(dx);
        dy = encodeLongForm(dy);
        writeInt16BE(dx);
        writeInt16BE(dy);
      }
    }
    writeInt8(0xff);
  }

  function writePecGraphicsBlock(data) {
    writePecGraph();
    writePecGraph();
    for (let i = 1; i < data.length; i++) {
      if (data[i].color !== data[i - 1].color) {
        writePecGraph();
      }
    }
  }

  function writePecHeaderBlock() {
    let colorsUsed = [];
    for (let i = 0; i < stitchData.length; i++) {
      if (i === 0 || stitchData[i].color !== stitchData[i - 1].color) {
        colorsUsed.push(stitchData[i].color);
      }
    }
    writeString("LA:" + title.padEnd(16, " ") + "\r");
    for (let i = 0; i < 12; i++) writeInt8(0x20);
    writeInt8(0xff);
    writeInt8(0x00);
    writeInt8(PEC_ICON_WIDTH / 8);
    writeInt8(PEC_ICON_HEIGHT);
    for (let i = 0; i < 12; i++) writeInt8(0x20);
    writeInt8(colorsUsed.length - 1);

    let colorIndexList = [];
    colorIndexList.push(colorsUsed.length - 1);
    let palette = [];
    for (let c of colorsUsed) {
      let idx = findColor(c);
      colorIndexList.push(idx);
      palette.push(c);
      writeInt8(idx);
    }
    for (let i = 0; i < 463 - palette.length; i++) {
      writeInt8(0x20);
    }
    return [colorIndexList, palette];
  }

  function doPecBlock(data) {
    let colorInfo = writePecHeaderBlock();
    writePecBlock(data);
    writePecGraphicsBlock(data);
    return colorInfo;
  }

  function buildStitchData(stitches, colors) {
    let data = [];
    for (let i = 0; i < stitches.length; i++) {
      data.push({
        x: stitches[i][0],
        y: stitches[i][1],
        color: colors[i],
      });
    }
    return data;
  }

  let stitchData = buildStitchData(scaledStitches, scaledColors);

  function writePesBlocks(stitchData, left, top, right, bottom) {
    if (stitchData.length === 0) return null;
    writePesString16("CEmbOne");
    writePesSewSegHeader(left, top, right, bottom);
    spaceHolder(2);
    writeInt16LE(0xffff);
    writeInt16LE(0x0000);
    writePesString16("CSewSeg");
    let segData = writePesEmbSewSegSegments(stitchData, left, bottom);
    writeSpaceHolder16LE(segData[0]);
    return segData[1];
  }

  function writePesSewSegHeader(left, top, right, bottom) {
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    let w = right - left;
    let h = bottom - top;

    // Identity transform, no random offset
    writeInt32LE(floatToBits(1));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(1));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(0));

    writeInt16LE(1);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(w);
    writeInt16LE(h);
    writeInt32LE(0);
    writeInt32LE(0);
  }

  function writePesEmbSewSegSegments(stitchData, left, bottom) {
    let sectionCount = 0;
    let colorLog = [];
    let segment = [];
    let flag = -1;
    let colorCode = findColor(stitchData[0].color);
    colorLog.push(sectionCount);
    colorLog.push(colorCode);
    let adjustX = left;
    let adjustY = bottom;

    let lx0 = stitchData[0].x;
    let ly0 = stitchData[0].y;
    segment.push(Math.round(lx0 - adjustX));
    segment.push(Math.round(ly0 - adjustY));
    // Duplicate first point
    segment.push(Math.round(lx0 - adjustX));
    segment.push(Math.round(ly0 - adjustY));
    flag = 1;
    writeInt16LE(flag);
    writeInt16LE(colorCode);
    writeInt16LE(segment.length / 2);
    for (let v of segment) {
      writeInt16LE(v);
    }
    sectionCount++;
    segment = [];

    for (let i = 0; i < stitchData.length; i++) {
      let thisColor = stitchData[i].color;
      let mode = 3;
      if (i > 0 && stitchData[i - 1].color !== thisColor) {
        mode = 8;
      }
      if (mode !== 0 && flag !== -1) {
        writeInt16LE(0x8003);
      }
      if (mode === 8) {
        colorCode = findColor(thisColor);
        colorLog.push(sectionCount);
        colorLog.push(colorCode);
        flag = 1;
      } else if (mode === 3) {
        while (i < stitchData.length && stitchData[i].color === thisColor) {
          segment.push(Math.round(stitchData[i].x - adjustX));
          segment.push(Math.round(stitchData[i].y - adjustY));
          i++;
        }
        i--;
        flag = 0;
      }
      if (segment.length !== 0) {
        writeInt16LE(flag);
        writeInt16LE(colorCode);
        writeInt16LE(segment.length / 2);
        for (let v of segment) {
          writeInt16LE(v);
        }
        sectionCount++;
      } else {
        flag = -1;
      }
      segment = [];
    }
    let count = colorLog.length / 2;
    writeInt16LE(count);
    for (let v of colorLog) {
      writeInt16LE(v);
    }
    writeInt16LE(0);
    writeInt16LE(0);
    return [sectionCount, colorLog];
  }

  function writePesHeaderV1(blockCount) {
    writeInt16LE(1);
    writeInt16LE(1);
    writeInt16LE(blockCount);
  }

  function writePesHeaderV6(blockCount) {
    writeInt16LE(1);
    writeInt8(0x30);
    writeInt8(0x32);
    writePesString8(title);
    writePesString8("category");
    writePesString8("author");
    writePesString8("keywords");
    writePesString8("comments");
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0x64);
    writeInt16LE(0x64);
    writeInt16LE(0);
    writeInt16LE(0xc8);
    writeInt16LE(0xc8);
    writeInt16LE(0x64);
    writeInt16LE(0x64);
    writeInt16LE(0x64);
    writeInt16LE(0x07);
    writeInt16LE(0x13);
    writeInt16LE(1);
    writeInt16LE(1);
    writeInt16LE(0);
    writeInt16LE(100);
    writeInt16LE(1);
    writeInt16LE(0);
    writeInt8(0);
    writeInt32LE(floatToBits(1));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(1));
    writeInt32LE(floatToBits(0));
    writeInt32LE(floatToBits(0));
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    let paletteCount = 1;
    for (let i = 1; i < scaledColors.length; i++) {
      if (scaledColors[i] !== scaledColors[i - 1]) paletteCount++;
    }
    writeInt16LE(paletteCount);
    writeInt16LE(blockCount);
  }

  function writePesAddendum(colorInfo) {
    let colorIndexList = colorInfo[0];
    let rgbList = colorInfo[1];
    let count = colorIndexList.length;
    for (let i = 0; i < count; i++) {
      writeInt8(colorIndexList[i]);
    }
    for (let i = count; i < 128; i++) {
      writeInt8(0x20);
    }
    for (let i = 0; i < rgbList.length; i++) {
      for (let j = 0; j < 0x90; j++) {
        writeInt8(0x00);
      }
    }
    for (let c of rgbList) {
      writeInt24LE(c);
    }
  }

  function finalize() {
    return new Uint8Array(buffer.slice(0, position));
  }

  function writePec() {
    let colorInfo = doPecBlock(stitchData);
    return colorInfo;
  }

  function writeVersion1() {
    writeString("#PES0001");
    spaceHolder(4);
    if (stitchData.length === 0) {
      writePesHeaderV1(0);
      writeInt16LE(0);
      writeInt16LE(0);
    } else {
      writePesHeaderV1(1);
      writeInt16LE(0xffff);
      writeInt16LE(0);
      let patternLeft = bounds[0];
      let patternTop = bounds[1];
      let patternRight = bounds[2];
      let patternBottom = bounds[3];
      writePesBlocks(
        stitchData,
        patternLeft,
        patternTop,
        patternRight,
        patternBottom
      );
    }
    writeSpaceHolder32LE(tell());
    writePec();
  }

  function writeTruncatedVersion1() {
    writeString("#PES0001");
    writeInt8(0x16);
    for (let i = 0; i < 13; i++) {
      writeInt8(0x00);
    }
    writePec();
  }

  function writeVersion6() {
    writeString("#PES0060");
    spaceHolder(4);
    if (stitchData.length === 0) {
      writePesHeaderV6(0);
      writeInt16LE(0);
      writeInt16LE(0);
    } else {
      writePesHeaderV6(1);
      writeInt16LE(0xffff);
      writeInt16LE(0);
      let patternLeft = bounds[0];
      let patternTop = bounds[1];
      let patternRight = bounds[2];
      let patternBottom = bounds[3];
      let log = writePesBlocks(
        stitchData,
        patternLeft,
        patternTop,
        patternRight,
        patternBottom
      );
      writeInt32LE(0);
      writeInt32LE(0);
      if (log) {
        for (let i = 0; i < log.length; i++) {
          writeInt32LE(i);
          writeInt32LE(0);
        }
      }
    }
    writeSpaceHolder32LE(tell());
    let colorInfo = writePec();
    writePesAddendum(colorInfo);
    writeInt16LE(0);
  }

  function writeTruncatedVersion6() {
    writeString("#PES0060");
    spaceHolder(4);
    writePesHeaderV6(0);
    for (let i = 0; i < 5; i++) writeInt8(0x00);
    writeInt16LE(0);
    writeInt16LE(0);
    let curPos = tell();
    writeSpaceHolder32LE(curPos);
    let colorInfo = writePec();
    writePesAddendum(colorInfo);
    writeInt16LE(0);
  }

  if (version === 1) {
    if (truncated) {
      writeTruncatedVersion1();
    } else {
      writeVersion1();
    }
  } else {
    if (truncated) {
      writeTruncatedVersion6();
    } else {
      writeVersion6();
    }
  }

  return finalize();
}
