/*
[
  {
    polylines: [ [ [x1, y1], [x2, y2] ], ... ],
    color: 3 // color index
  },
  ...
]

*/

function exportPes(data) {
  const bytes = [];

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
  const writeStringUtf8 = (str) => {
    if (!str) return;
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
  };

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  data.forEach(({ polylines }) => {
    polylines.forEach((poly) => {
      poly.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
  });

  if (!isFinite(minX)) {
    writeStringUtf8("#PES0001");
    for (let i = 0; i < 22; i++) bytes.push(0);
    return new Uint8Array(bytes);
  }

  const cx = 0.5 * (minX + maxX);
  const cy = 0.5 * (minY + maxY);
  const left = minX - cx;
  const top = minY - cy;
  const right = maxX - cx;
  const bottom = maxY - cy;
  const width = right - left;
  const height = bottom - top;

  writeStringUtf8("#PES0001");
  const pecOffsetPos = bytes.length;
  writeInt32LE(0);

  const hasData = data.some((d) => d.polylines.length > 0);
  writeInt16LE(1);
  writeInt16LE(1);
  writeInt16LE(hasData ? 1 : 0);

  if (!hasData) {
    writeInt16LE(0);
    writeInt16LE(0);
  } else {
    writeInt16LE(0xffff);
    writeInt16LE(0x0000);

    // EMB_ONE
    const embOne = "CEmbOne";
    for (let i = 0; i < embOne.length; i++) {
      writeInt16LE(embOne.charCodeAt(i));
    }

    for (let i = 0; i < 8; i++) writeInt16LE(0);
    writeFloat32LE(1);
    writeFloat32LE(0);
    writeFloat32LE(0);
    writeFloat32LE(1);

    const hoopWidth = 1300;
    const hoopHeight = 1800;
    let tx = 350 + hoopWidth / 2 - width / 2;
    let ty = 100 + hoopHeight / 2 - height / 2 + height;
    writeFloat32LE(tx);
    writeFloat32LE(ty);

    writeInt16LE(1);
    writeInt16LE(0);
    writeInt16LE(0);
    writeInt16LE(Math.round(width));
    writeInt16LE(Math.round(height));
    for (let i = 0; i < 8; i++) writeInt8(0);

    const sectionCountPos = bytes.length;
    writeInt16LE(0);

    writeInt16LE(0xffff);
    writeInt16LE(0x0000);

    // EMB_SEG
    const embSeg = "CSewSeg";
    for (let i = 0; i < embSeg.length; i++) {
      writeInt16LE(embSeg.charCodeAt(i));
    }

    let sections = 0;
    let prevColor = -1;
    let firstSection = true;
    const colorLog = [];
    let sectionIndex = 0;

    data.forEach(({ polylines, color }) => {
      polylines.forEach((poly) => {
        if (!poly.length) return;
        if (!firstSection) writeInt16LE(0x8003);
        firstSection = false;

        if (color !== prevColor) {
          colorLog.push([sectionIndex, color]);
          prevColor = color;
        }
        // Jump
        writeInt16LE(1);
        writeInt16LE(color);
        writeInt16LE(2);
        writeInt16LE(Math.round(poly[0][0] - (left + cx)));
        writeInt16LE(Math.round(poly[0][1] - (bottom + cy)));
        sections++;
        sectionIndex++;

        // Stitch
        writeInt16LE(0);
        writeInt16LE(color);
        writeInt16LE(poly.length);
        poly.forEach(([px, py]) => {
          writeInt16LE(Math.round(px - (left + cx)));
          writeInt16LE(Math.round(py - (bottom + cy)));
        });
        sections++;
        sectionIndex++;
      });
    });

    writeInt16LE(colorLog.length);
    colorLog.forEach(([sIdx, cIdx]) => {
      writeInt16LE(sIdx);
      writeInt16LE(cIdx);
    });

    const endPos = bytes.length;
    bytes[sectionCountPos] = sections & 0xff;
    bytes[sectionCountPos + 1] = (sections >> 8) & 0xff;

    writeInt16LE(0);
    writeInt16LE(0);
  }

  const pecOffset = bytes.length;
  bytes[pecOffsetPos] = pecOffset & 0xff;
  bytes[pecOffsetPos + 1] = (pecOffset >> 8) & 0xff;
  bytes[pecOffsetPos + 2] = (pecOffset >> 16) & 0xff;
  bytes[pecOffsetPos + 3] = (pecOffset >> 24) & 0xff;

  writeStringUtf8("LA");
  writeInt8(0);

  return new Uint8Array(bytes);
}
