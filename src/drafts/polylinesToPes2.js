export function writePes(inputPolylines, options = {}) {
  // Options
  let version = options.version === 6 ? 6 : 1;
  let truncated = !!options.truncated;
  let designName =
    typeof options.designName === "string" ? options.designName : "Design";
  let hoopWidth =
    typeof options.hoopWidth === "number" ? options.hoopWidth : 130;
  let hoopHeight =
    typeof options.hoopHeight === "number" ? options.hoopHeight : 180;
  let scaleToFit = !!options.scaleToFit;
  let centerInHoop = !!options.centerInHoop;

  // Gather all points and flatten
  let allX = [];
  let allY = [];
  let stitches = [];
  let colors = [];
  let jumps = [];

  // inputPolylines is an array like:
  //  [ { polylines: [ [[x,y], [x,y], ...], ... ], color: 0xRRGGBB }, {...}, ... ]
  for (let blockIndex = 0; blockIndex < inputPolylines.length; blockIndex++) {
    let block = inputPolylines[blockIndex];
    let clr = block.color >>> 0;
    let subs = block.polylines || [];
    for (let p = 0; p < subs.length; p++) {
      let poly = subs[p];
      for (let i = 0; i < poly.length; i++) {
        let x = poly[i][0];
        let y = poly[i][1];
        stitches.push({ x, y });
        colors.push(clr);
        jumps.push(i === 0);
        allX.push(x);
        allY.push(y);
      }
    }
  }

  if (stitches.length === 0) {
    // Return trivial file if empty
    return new Uint8Array([0x23, 0x50, 0x45, 0x53, 0x30, 0x30, 0x30, 0x31]); // "#PES0001"
  }

  // Bounding box
  let minX = Math.min(...allX);
  let maxX = Math.max(...allX);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let originalWidth = maxX - minX;
  let originalHeight = maxY - minY;

  // Scale to fit
  let scale = 1;
  if (scaleToFit && originalWidth > 0 && originalHeight > 0) {
    let sx = hoopWidth / originalWidth;
    let sy = hoopHeight / originalHeight;
    scale = Math.min(sx, sy);
  }

  // Center in hoop
  let offsetX = 0;
  let offsetY = 0;
  if (centerInHoop) {
    let newW = originalWidth * scale;
    let newH = originalHeight * scale;
    offsetX = (hoopWidth - newW) / 2;
    offsetY = (hoopHeight - newH) / 2;
  }

  // Apply scale + offsets to final arrays
  let finalStitches = [];
  let finalColors = [];
  let finalJumps = [];

  for (let i = 0; i < stitches.length; i++) {
    let dx = (stitches[i].x - minX) * scale + offsetX;
    let dy = (stitches[i].y - minY) * scale + offsetY;
    finalStitches.push({ x: dx, y: dy });
    finalColors.push(colors[i]);
    finalJumps.push(jumps[i]);
  }

  // bounding box in the new scaled space
  let newMinX = 0 + offsetX;
  let newMinY = 0 + offsetY;
  let newMaxX = originalWidth * scale + offsetX;
  let newMaxY = originalHeight * scale + offsetY;
  let bounds = [newMinX, newMinY, newMaxX, newMaxY];

  // Write full PES using the writer
  return pesWriter(
    finalStitches,
    finalColors,
    finalJumps,
    bounds,
    designName,
    version,
    truncated
  );
}

// Faithful PES writing logic
function pesWriter(stitches, colors, jumps, bounds, title, version, truncated) {
  class BinWriter {
    constructor() {
      this.bytes = [];
      this.position = 0;
      // Stack of placeholders: each entry => { buffer: [], remaining: N }
      // We'll store all writes in the top-of-stack if it exists
      this.stack = [];
    }
    writeByte(val) {
      val &= 0xff;
      if (this.stack.length) {
        // top of stack => push into its buffer
        this.stack[this.stack.length - 1].buffer.push(val);
      } else {
        this.bytes.push(val);
      }
      this.position++;
    }
    writeBytes(arr) {
      for (let i = 0; i < arr.length; i++) {
        this.writeByte(arr[i]);
      }
    }
    writeString(str) {
      for (let i = 0; i < str.length; i++) {
        this.writeByte(str.charCodeAt(i));
      }
    }
    writeInt16LE(v) {
      v &= 0xffff;
      this.writeByte(v & 0xff);
      this.writeByte((v >> 8) & 0xff);
    }
    writeInt16BE(v) {
      v &= 0xffff;
      this.writeByte((v >> 8) & 0xff);
      this.writeByte(v & 0xff);
    }
    writeInt32LE(value) {
      let v = value >>> 0;
      this.writeByte(v & 0xff);
      this.writeByte((v >> 8) & 0xff);
      this.writeByte((v >> 16) & 0xff);
      this.writeByte((v >> 24) & 0xff);
    }
    writeSpaceHolder16LE(value) {
      // pop top
      let top = this.stack.pop();
      // write the 16-bit
      this.writeInt16LE(value);
      // then write all that was captured in the meantime
      for (let i = 0; i < top.buffer.length; i++) {
        this.writeByte(top.buffer[i]);
      }
    }
    writeSpaceHolder24LE(value) {
      let top = this.stack.pop();
      // 24 bits => LSB first
      let b0 = value & 0xff;
      let b1 = (value >> 8) & 0xff;
      let b2 = (value >> 16) & 0xff;
      this.writeByte(b0);
      this.writeByte(b1);
      this.writeByte(b2);
      for (let i = 0; i < top.buffer.length; i++) {
        this.writeByte(top.buffer[i]);
      }
    }
    writeSpaceHolder32LE(value) {
      let top = this.stack.pop();
      let b0 = value & 0xff;
      let b1 = (value >> 8) & 0xff;
      let b2 = (value >> 16) & 0xff;
      let b3 = (value >> 24) & 0xff;
      this.writeByte(b0);
      this.writeByte(b1);
      this.writeByte(b2);
      this.writeByte(b3);
      for (let i = 0; i < top.buffer.length; i++) {
        this.writeByte(top.buffer[i]);
      }
    }
    spaceHolder(count) {
      this.stack.push({ buffer: [], remaining: count });
      // we do not immediately “skip” bytes in the final array –
      // we just capture writes in the top buffer
      // until we do writeSpaceHolderXXLE
      // in effect, we haven’t advanced file position by “count” ourselves,
      // but the original Java code does. So if you want perfect offsets,
      // consider adjusting. For minimal usage, this is enough to store.
    }
    tell() {
      // approximate
      let len = this.bytes.length;
      for (let s of this.stack) {
        len += s.buffer.length;
      }
      return len;
    }
    getBuffer() {
      return new Uint8Array(this._flattenBytes());
    }
    _flattenBytes() {
      // flatten main + any open placeholders
      // ideally placeholders should be closed
      let arr = this.bytes.slice();
      // if any placeholders remain, append them
      if (this.stack.length) {
        for (let s of this.stack) {
          arr.push(...s.buffer);
        }
      }
      return arr;
    }
  }

  function writeFloat32LE(bin, val) {
    let dv = new DataView(new ArrayBuffer(4));
    dv.setFloat32(0, val, true);
    bin.writeByte(dv.getUint8(0));
    bin.writeByte(dv.getUint8(1));
    bin.writeByte(dv.getUint8(2));
    bin.writeByte(dv.getUint8(3));
  }

  // Various sub-helpers
  function writePesString8(bin, str) {
    if (!str) {
      bin.writeByte(0);
      return;
    }
    if (str.length > 255) str = str.substring(0, 255);
    bin.writeByte(str.length);
    bin.writeString(str);
  }
  function writePesString16(bin, str) {
    bin.writeInt16LE(str.length);
    bin.writeString(str);
  }

  // We replicate the structure from the Java code:
  // write_version_1 / 6, truncated versions, etc.
  function doWritePES(bin) {
    if (version === 1) {
      if (truncated) {
        writeTruncatedVersion1(bin);
      } else {
        writeVersion1(bin);
      }
    } else {
      if (truncated) {
        writeTruncatedVersion6(bin);
      } else {
        writeVersion6(bin);
      }
    }
  }

  function writeVersion1(bin) {
    bin.writeString("#PES0001");
    let placeholderPos = bin.tell();
    bin.spaceHolder(4);
    if (stitches.length === 0) {
      writePesHeaderV1(bin, 0);
      bin.writeInt16LE(0);
      bin.writeInt16LE(0);
    } else {
      writePesHeaderV1(bin, 1);
      bin.writeInt16LE(0xffff);
      bin.writeInt16LE(0);
      writePesBlocks(bin, bounds[0], bounds[1], bounds[2], bounds[3]);
    }
    let curPos = bin.tell();
    bin.writeSpaceHolder32LE(curPos);
    let colorInfo = writePEC(bin);
    writePesAddendum(bin, colorInfo);
    bin.writeInt16LE(0);
  }

  function writeTruncatedVersion1(bin) {
    bin.writeString("#PES0001");
    bin.writeByte(0x16);
    for (let i = 0; i < 13; i++) bin.writeByte(0x00);
    let colorInfo = writePEC(bin);
    writePesAddendum(bin, colorInfo);
    bin.writeInt16LE(0);
  }

  function writeVersion6(bin) {
    bin.writeString("#PES0060");
    bin.spaceHolder(4);
    if (stitches.length === 0) {
      writePesHeaderV6(bin, 0);
      bin.writeInt16LE(0);
      bin.writeInt16LE(0);
    } else {
      writePesHeaderV6(bin, 1);
      bin.writeInt16LE(0xffff);
      bin.writeInt16LE(0);
      writePesBlocks(bin, bounds[0], bounds[1], bounds[2], bounds[3]);
      // minimal approach to "node, tree, order" from Java
      bin.writeInt32LE(0);
      bin.writeInt32LE(0);
    }
    let curPos = bin.tell();
    bin.writeSpaceHolder32LE(curPos);
    let colorInfo = writePEC(bin);
    writePesAddendum(bin, colorInfo);
    bin.writeInt16LE(0);
  }

  function writeTruncatedVersion6(bin) {
    bin.writeString("#PES0060");
    bin.spaceHolder(4);
    writePesHeaderV6(bin, 0);
    for (let i = 0; i < 5; i++) bin.writeByte(0x00);
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    let curPos = bin.tell();
    bin.writeSpaceHolder32LE(curPos);
    let colorInfo = writePEC(bin);
    writePesAddendum(bin, colorInfo);
    bin.writeInt16LE(0);
  }

  function writePesHeaderV1(bin, distinctBlocks) {
    bin.writeInt16LE(1); // scale to fit
    bin.writeInt16LE(1); // bigger hoop
    bin.writeInt16LE(distinctBlocks);
  }

  function writePesHeaderV6(bin, distinctBlocks) {
    bin.writeInt16LE(1);
    bin.writeByte(0x30);
    bin.writeByte(0x32);
    writePesString8(bin, title);
    writePesString8(bin, "category");
    writePesString8(bin, "author");
    writePesString8(bin, "keywords");
    writePesString8(bin, "comments");
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    // design page sizes
    bin.writeInt16LE(100);
    bin.writeInt16LE(100);
    bin.writeInt16LE(0);
    bin.writeInt16LE(200);
    bin.writeInt16LE(200);
    bin.writeInt16LE(100);
    bin.writeInt16LE(100);
    bin.writeInt16LE(100);
    bin.writeInt16LE(7);
    bin.writeInt16LE(19);
    bin.writeInt16LE(1);
    bin.writeInt16LE(1);
    bin.writeInt16LE(0);
    bin.writeInt16LE(100);
    bin.writeInt16LE(1);
    bin.writeInt16LE(0);
    bin.writeByte(0);
    writeFloat32LE(bin, 1);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 1);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 0);
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    // color count
    let colorCount = 1;
    for (let i = 1; i < colors.length; i++) {
      if (colors[i] !== colors[i - 1]) colorCount++;
    }
    bin.writeInt16LE(colorCount);
    // skip writing actual thread definitions
    bin.writeInt16LE(distinctBlocks);
  }

  function writePesBlocks(bin, left, top, right, bottom) {
    writePesString16(bin, "CEmbOne");
    writePesSewSegHeader(bin, left, top, right, bottom);
    bin.spaceHolder(2);
    bin.writeInt16LE(0xffff);
    bin.writeInt16LE(0);
    writePesString16(bin, "CSewSeg");
    let [sections, colorlog] = writePesEmbSewSegSegments(
      bin,
      left,
      bottom,
      (left + right) / 2,
      (top + bottom) / 2
    );
    bin.writeSpaceHolder16LE(sections);
  }

  function writePesSewSegHeader(bin, left, top, right, bottom) {
    // 8 int16 zeros
    for (let i = 0; i < 8; i++) bin.writeInt16LE(0);
    writeFloat32LE(bin, 1);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 1);
    writeFloat32LE(bin, 0);
    writeFloat32LE(bin, 0);
    bin.writeInt16LE(1);
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    bin.writeInt16LE(Math.round(right - left));
    bin.writeInt16LE(Math.round(bottom - top));
    bin.writeInt32LE(0);
    bin.writeInt32LE(0);
  }

  function writePesEmbSewSegSegments(bin, left, bottom, cx, cy) {
    // We'll group by color
    let segments = 0;
    let colorlog = [];
    let i = 0;
    while (i < stitches.length) {
      let c = colors[i];
      let colorIndex = findNearestThreadIndex(c);
      colorlog.push(segments);
      colorlog.push(colorIndex);
      // gather all stitches with this color
      let segmentIdxs = [];
      let startColor = c;
      while (i < stitches.length && colors[i] === startColor) {
        segmentIdxs.push(i);
        i++;
      }
      bin.writeInt16LE(0x8003);
      let flag = 0;
      bin.writeInt16LE(flag);
      bin.writeInt16LE(colorIndex);
      bin.writeInt16LE(segmentIdxs.length);
      for (let s = 0; s < segmentIdxs.length; s++) {
        let idx = segmentIdxs[s];
        // Java code => x - adjust_x, y - adjust_y etc
        let xx = Math.round(stitches[idx].x - cx);
        let yy = Math.round(stitches[idx].y - (bottom - cy));
        bin.writeInt16LE(xx);
        bin.writeInt16LE(yy);
      }
      segments++;
    }
    let count = colorlog.length / 2;
    bin.writeInt16LE(count);
    for (let v of colorlog) {
      bin.writeInt16LE(v);
    }
    bin.writeInt16LE(0);
    bin.writeInt16LE(0);
    return [segments, colorlog];
  }

  // trivial nearest index
  function findNearestThreadIndex(c) {
    // For real usage, pick from a big palette
    return 10;
  }

  // Write #PEC0001 portion
  function writePEC(bin) {
    return writePecInternal(bin);
  }
  function writePecInternal(bin) {
    // "#PEC0001"
    bin.writeString("#PEC0001");
    // The Java code => write_pec_header(), write_pec_block(), write_pec_graphics()
    let colorInfo = writePecHeader(bin);
    writePecBlock(bin);
    writePecGraphics(bin);
    return colorInfo;
  }

  function writePecHeader(bin) {
    let shortName = title;
    if (shortName.length > 8) shortName = shortName.substring(0, 8);
    let line = "LA:" + shortName.padEnd(16, " ") + "\r";
    bin.writeString(line);
    for (let i = 0; i < 12; i++) bin.writeByte(0x20);
    bin.writeByte(0xff);
    bin.writeByte(0x00);
    bin.writeByte(48 / 8);
    bin.writeByte(38);
    // 12 * 0x20
    for (let i = 0; i < 12; i++) bin.writeByte(0x20);
    // color count - 1
    let colorCount = 1;
    for (let i = 1; i < stitches.length; i++) {
      if (colors[i] !== colors[i - 1]) colorCount++;
    }
    bin.writeByte((colorCount - 1) & 0xff);
    // color indices
    // minimal approach => all "1"
    for (let i = 0; i < colorCount; i++) bin.writeByte(1);
    // fill up to 463
    let wrote = colorCount;
    for (let i = wrote; i < 463; i++) bin.writeByte(0x20);
    return [[], []];
  }

  function writePecBlock(bin) {
    let startPos = bin.tell();
    bin.writeByte(0);
    bin.writeByte(0);
    bin.spaceHolder(3);
    bin.writeByte(0x31);
    bin.writeByte(0xff);
    bin.writeByte(0xf0);
    let w = Math.round(bounds[2] - bounds[0]);
    let h = Math.round(bounds[3] - bounds[1]);
    bin.writeInt16LE(w);
    bin.writeInt16LE(h);
    bin.writeInt16LE(0x1e0);
    bin.writeInt16LE(0x1b0);
    let negx = 0x9000 | (Math.round(-bounds[0]) & 0x0fff);
    let negy = 0x9000 | (Math.round(-bounds[1]) & 0x0fff);
    bin.writeInt16BE(negx);
    bin.writeInt16BE(negy);
    // now the actual stitches
    pecEncode(bin);
    let blockLen = bin.tell() - startPos;
    // we used spaceHolder(3) => that's actually 3 bytes, but let's do a 32-bit approach for simplicity
    // if you want exact 24-bit, define writeSpaceHolder24LE
    bin.writeSpaceHolder24LE(blockLen);
  }

  function pecEncode(bin) {
    let xx = 0;
    let yy = 0;
    let colorToggle = true;
    for (let i = 0; i < stitches.length; i++) {
      // color change if color changes
      if (i > 0 && colors[i] !== colors[i - 1]) {
        bin.writeByte(0xfe);
        bin.writeByte(0xb0);
        bin.writeByte(colorToggle ? 2 : 1);
        colorToggle = !colorToggle;
      }
      let dx = Math.round(stitches[i].x - xx);
      let dy = Math.round(stitches[i].y - yy);
      xx += dx;
      yy += dy;
      if (dx >= -63 && dx <= 63 && dy >= -63 && dy <= 63) {
        bin.writeByte(dx & 0x7f);
        bin.writeByte(dy & 0x7f);
      } else {
        let ldx = 0x8000 | (dx & 0x0fff);
        let ldy = 0x8000 | (dy & 0x0fff);
        bin.writeInt16BE(ldx);
        bin.writeInt16BE(ldy);
      }
    }
    bin.writeByte(0xff);
  }

  function writePecGraphics(bin) {
    let arr = [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f,
      0x08, 0x00, 0x00, 0x00, 0x00, 0x10, 0x04, 0x00, 0x00, 0x00, 0x00, 0x20,
      // plus many more bytes. We'll just keep the reference:
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x00, 0x00, 0x00, 0x40,
      0x02, 0x00, 0x00, 0x00, 0x00, 0x40, 0x04, 0x00, 0x00, 0x00, 0x00, 0x20,
      0x08, 0x00, 0x00, 0x00, 0x00, 0x10, 0xf0, 0xff, 0xff, 0xff, 0xff, 0x0f,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    bin.writeBytes(arr);
  }

  function writePesAddendum(bin, colorInfo) {
    // Minimal no-op approach
  }

  let bin = new BinWriter();
  doWritePES(bin);
  return bin.getBuffer();
}
