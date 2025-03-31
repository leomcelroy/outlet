export function polylinesToPes(polylines, options = {}) {
  // Gather options
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

  // Collect points/colors; track bounding box
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

  console.log({ rawStitches, rawColors });

  // Scale or center if asked
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
    if (!str) {
      writeInt16LE(0);
      return;
    }
    writeInt16LE(str.length);
    writeString(str);
  }
  let placeStack = [];
  function spaceHolder(count) {
    let startPos = tell();
    for (let i = 0; i < count; i++) writeInt8(0);
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
  let TRIM_CODE = 0x20;
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
      0x04, 0x00, 0x00, 0x00, 0x00, 0x20, 0x08, 0x00, 0x00, 0x00, 0x00, 0x10,
      0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
  }
  function writePecStitches(data) {
    let colorToggle = true;
    let xx = 0,
      yy = 0;
    for (let i = 0; i < data.length; i++) {
      if (i > 0 && data[i].color !== data[i - 1].color) {
        writeInt8(0xfe);
        writeInt8(0xb0);
        writeInt8(colorToggle ? 2 : 1);
        colorToggle = !colorToggle;
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
  function writePecBlock(stitches) {
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
    writeInt16BE(0x9000 | -Math.round(bounds[0]));
    writeInt16BE(0x9000 | -Math.round(bounds[1]));
    writePecStitches(stitches);
    let blockLen = tell() - startPos;
    writeSpaceHolder24LE(blockLen);
  }
  function writePecHeaderBlock(stitches) {
    let colorBreaks = [];
    for (let i = 0; i < stitches.length; i++) {
      if (i === 0 || stitches[i].color !== stitches[i - 1].color) {
        colorBreaks.push(stitches[i].color);
      }
    }
    writeString("LA:" + title.padEnd(16, " ") + "\r");
    for (let i = 0; i < 12; i++) writeInt8(0x20);
    writeInt8(0xff);
    writeInt8(0x00);
    writeInt8(PEC_ICON_WIDTH / 8);
    writeInt8(PEC_ICON_HEIGHT);
    for (let i = 0; i < 12; i++) writeInt8(0x20);
    writeInt8(colorBreaks.length - 1);
    let colorIndexList = [colorBreaks.length - 1];
    for (let clr of colorBreaks) {
      let idx = findColor(clr);
      colorIndexList.push(idx);
      writeInt8(idx);
    }
    for (let i = 0; i < 463 - colorBreaks.length; i++) writeInt8(0x20);
    return [colorIndexList, colorBreaks];
  }
  function writePecGraphicsBlock(stitches) {
    writePecGraph();
    writePecGraph();
    for (let i = 1; i < stitches.length; i++) {
      if (stitches[i].color !== stitches[i - 1].color) {
        writePecGraph();
      }
    }
  }
  function writePec(stitches) {
    let colorInfo = writePecHeaderBlock(stitches);
    writePecBlock(stitches);
    writePecGraphicsBlock(stitches);
    return colorInfo;
  }
  function float32LE(f) {
    return floatToBits(f);
  }

  function buildStitchData(st, c) {
    let out = [];
    for (let i = 0; i < st.length; i++) {
      out.push({ x: st[i][0], y: st[i][1], color: c[i] });
    }
    return out;
  }
  let stitchData = buildStitchData(scaledStitches, scaledColors);

  function writePesSewSegHeader(l, t, r, b) {
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    let w = r - l;
    let h = b - t;
    writeInt32LE(float32LE(1));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(1));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(0));
    writeInt16LE(1);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(w);
    writeInt16LE(h);
    writeInt32LE(0);
    writeInt32LE(0);
    return tell();
  }
  function writePesEmbSewSegSegments(data, l, b) {
    let sectionCount = 0;
    let colorLog = [];
    if (data.length === 0) return [sectionCount, colorLog];
    let colorCode = findColor(data[0].color);
    colorLog.push(sectionCount);
    colorLog.push(colorCode);
    let adjustX = l;
    let adjustY = b;
    let segment = [];
    segment.push(Math.round(data[0].x - adjustX));
    segment.push(Math.round(data[0].y - adjustY));
    segment.push(Math.round(data[0].x - adjustX));
    segment.push(Math.round(data[0].y - adjustY));
    let flag = 1;
    writeInt16LE(flag);
    writeInt16LE(colorCode);
    writeInt16LE(segment.length / 2);
    for (let v of segment) writeInt16LE(v);
    sectionCount++;
    segment = [];
    for (let i = 0; i < data.length; i++) {
      let thisColor = data[i].color;
      let mode = 3;
      if (i > 0 && data[i - 1].color !== thisColor) {
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
        while (i < data.length && data[i].color === thisColor) {
          let px = Math.round(data[i].x - adjustX);
          let py = Math.round(data[i].y - adjustY);
          segment.push(px);
          segment.push(py);
          i++;
        }
        i--;
        flag = 0;
      }
      if (segment.length) {
        writeInt16LE(flag);
        writeInt16LE(colorCode);
        writeInt16LE(segment.length / 2);
        for (let v of segment) writeInt16LE(v);
        sectionCount++;
      } else {
        flag = -1;
      }
      segment = [];
    }
    let count = colorLog.length / 2;
    writeInt16LE(count);
    for (let v of colorLog) writeInt16LE(v);
    writeInt16LE(0);
    writeInt16LE(0);
    return [sectionCount, colorLog];
  }

  function writePesBlocks(data, l, t, r, b) {
    if (!data.length) return null;
    writePesString16("CEmbOne");
    let sewSegStart = writePesSewSegHeader(l, t, r, b);
    spaceHolder(2);
    writeInt16LE(0xffff);
    writeInt16LE(0);
    writePesString16("CSewSeg");
    let segData = writePesEmbSewSegSegments(data, l, b);
    writeSpaceHolder16LE(segData[0]);
    return segData[1];
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
    writeInt32LE(float32LE(1));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(1));
    writeInt32LE(float32LE(0));
    writeInt32LE(float32LE(0));
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(0);
    let distinctColors = 1;
    for (let i = 1; i < scaledColors.length; i++) {
      if (scaledColors[i] !== scaledColors[i - 1]) distinctColors++;
    }
    writeInt16LE(distinctColors);
    for (let i = 0; i < distinctColors; i++) {
      writePesString8("Color" + i);
      writeInt8(0);
      writeInt8(0);
      writeInt8(0);
      writeInt8(0);
      writeInt32LE(0x0a);
      writePesString8("desc");
      writePesString8("brand");
      writePesString8("chart");
    }
    writeInt16LE(blockCount);
  }
  function writePesAddendum(colorInfo) {
    let colorIndexList = colorInfo[0];
    let palette = colorInfo[1];
    for (let i = 0; i < colorIndexList.length; i++) {
      writeInt8(colorIndexList[i]);
    }
    for (let i = colorIndexList.length; i < 128; i++) {
      writeInt8(0x20);
    }
    for (let i = 0; i < palette.length; i++) {
      for (let j = 0; j < 0x90; j++) {
        writeInt8(0x00);
      }
    }
    for (let c of palette) {
      writeInt24LE(c);
    }
  }

  function finalize() {
    return new Uint8Array(buffer.slice(0, position));
  }

  function writeVersion1() {
    writeString("#PES0001");
    spaceHolder(4);
    if (!stitchData.length) {
      writePesHeaderV1(0);
      writeInt16LE(0);
      writeInt16LE(0);
    } else {
      writePesHeaderV1(1);
      writeInt16LE(0xffff);
      writeInt16LE(0);
      let [l, t, r, b] = bounds;
      writePesBlocks(stitchData, l, t, r, b);
    }
    writeSpaceHolder32LE(tell());
    writePec(stitchData);
  }
  function writeTruncatedVersion1() {
    writeString("#PES0001");
    writeInt8(0x16);
    for (let i = 0; i < 13; i++) writeInt8(0x00);
    writePec(stitchData);
  }
  function writeVersion6() {
    writeString("#PES0060");
    spaceHolder(4);
    if (!stitchData.length) {
      writePesHeaderV6(0);
      writeInt16LE(0);
      writeInt16LE(0);
    } else {
      writePesHeaderV6(1);
      writeInt16LE(0xffff);
      writeInt16LE(0);
      let [l, t, r, b] = bounds;
      let log = writePesBlocks(stitchData, l, t, r, b);
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
    let colorInfo = writePec(stitchData);
    writePesAddendum(colorInfo);
    writeInt16LE(0);
  }
  function writeTruncatedVersion6() {
    writeString("#PES0060");
    spaceHolder(4);
    writePesHeaderV6(0);
    for (let i = 0; i < 5; i++) writeInt8(0);
    writeInt16LE(0);
    writeInt16LE(0);
    let curPos = tell();
    writeSpaceHolder32LE(curPos);
    let colorInfo = writePec(stitchData);
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
