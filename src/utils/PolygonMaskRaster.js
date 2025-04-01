export class PolygonMaskRaster {
  constructor(polylines, pxPerUnit = 10) {
    this.pxPerUnit = pxPerUnit;
    // Filter out polylines that are not closed (first point equals last point)
    const closedPolylines = polylines.filter(
      (poly) =>
        poly.length >= 4 &&
        poly[0][0] === poly[poly.length - 1][0] &&
        poly[0][1] === poly[poly.length - 1][1]
    );
    if (closedPolylines.length === 0) {
      throw new Error("No closed polylines provided");
    }

    // Select the polygon with the largest absolute area as the main polygon;
    // treat the rest as holes.
    let mainPolygon = closedPolylines[0];
    let mainArea = Math.abs(PolygonMask.computeArea(mainPolygon));
    const holes = [];
    for (let i = 1; i < closedPolylines.length; i++) {
      const area = Math.abs(PolygonMask.computeArea(closedPolylines[i]));
      if (area > mainArea) {
        holes.push(mainPolygon);
        mainPolygon = closedPolylines[i];
        mainArea = area;
      } else {
        holes.push(closedPolylines[i]);
      }
    }
    this.mainPolygon = mainPolygon;
    this.holes = holes;

    // Compute bounding box of the main polygon.
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of mainPolygon) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    // Determine mask dimensions in pixels.
    const widthUnits = maxX - minX;
    const heightUnits = maxY - minY;
    this.width = Math.ceil(widthUnits * pxPerUnit);
    this.height = Math.ceil(heightUnits * pxPerUnit);

    // Create the Uint8Array mask (row-major order).
    this.mask = new Uint8Array(this.width * this.height);

    // Rasterize the main polygon with holes.
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        // Map pixel center to world coordinates.
        const worldX = minX + (i + 0.5) / pxPerUnit;
        const worldY = minY + (j + 0.5) / pxPerUnit;
        if (PolygonMask.pointInPolygon(worldX, worldY, mainPolygon)) {
          let inHole = false;
          for (const hole of holes) {
            if (PolygonMask.pointInPolygon(worldX, worldY, hole)) {
              inHole = true;
              break;
            }
          }
          if (!inHole) {
            this.mask[j * this.width + i] = 1;
          }
        }
      }
    }
  }

  // Returns true if the point (x, y) in world coordinates is inside the masked area.
  query(x, y) {
    if (x < this.minX || y < this.minY) return false;
    const i = Math.floor((x - this.minX) * this.pxPerUnit);
    const j = Math.floor((y - this.minY) * this.pxPerUnit);
    if (i < 0 || i >= this.width || j < 0 || j >= this.height) return false;
    return this.mask[j * this.width + i] === 1;
  }

  // Computes the signed area of a polygon using the shoelace formula.
  static computeArea(poly) {
    let area = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    }
    return area / 2;
  }

  // Determines if a point (x, y) is inside a polygon using the ray-casting algorithm.
  static pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
}
