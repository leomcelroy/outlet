export class PolygonMask {
  constructor(polygons) {
    // Filter to keep only closed polygons (at least 4 points and first equals last)
    this.polygons = polygons.filter(
      (poly) =>
        poly.length >= 4 &&
        poly[0][0] === poly[poly.length - 1][0] &&
        poly[0][1] === poly[poly.length - 1][1]
    );
    if (this.polygons.length === 0) {
      throw new Error("No closed polygons provided");
    }
    // Compute bounding box area for each polygon
    const getBBoxArea = (poly) => {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (let [x, y] of poly) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return (maxX - minX) * (maxY - minY);
    };

    let mainPolygon = this.polygons[0];
    let mainBBoxArea = getBBoxArea(mainPolygon);
    const holes = [];
    for (let i = 1; i < this.polygons.length; i++) {
      const area = getBBoxArea(this.polygons[i]);
      if (area > mainBBoxArea) {
        holes.push(mainPolygon);
        mainPolygon = this.polygons[i];
        mainBBoxArea = area;
      } else {
        holes.push(this.polygons[i]);
      }
    }
    this.mainPolygon = mainPolygon;
    this.holes = holes;
  }

  // Returns true if the point (x, y) is inside the main polygon and not in any hole.
  query(x, y) {
    if (!PolygonMask.pointInPolygon(x, y, this.mainPolygon)) return false;
    for (let hole of this.holes) {
      if (PolygonMask.pointInPolygon(x, y, hole)) return false;
    }
    return true;
  }

  // Ray-casting algorithm to determine if a point is inside a polygon.
  static pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
