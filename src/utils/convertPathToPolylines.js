export function convertPathToPolylines(pathData) {
  if (!pathData || !Array.isArray(pathData) || pathData.length === 0) {
    return [];
  }

  const polylines = [];
  let currentPolyline = [];
  let currentStartPoint = null;

  for (const segment of pathData) {
    if (segment.cmd === "move") {
      // If we have an existing polyline, save it before starting a new one
      if (currentPolyline.length > 0) {
        polylines.push(currentPolyline);
      }
      // Start a new polyline
      currentPolyline = [[segment.x, segment.y]];
      currentStartPoint = [segment.x, segment.y];
    } else if (segment.cmd === "line") {
      currentPolyline.push([segment.x, segment.y]);
    } else if (segment.cmd === "close" && currentStartPoint) {
      // Close the current polyline by adding the start point
      const lastPoint = currentPolyline[currentPolyline.length - 1];
      if (
        lastPoint[0] !== currentStartPoint[0] ||
        lastPoint[1] !== currentStartPoint[1]
      ) {
        currentPolyline.push([currentStartPoint[0], currentStartPoint[1]]);
      }
      // Save this closed polyline and reset for potential next subpath
      polylines.push(currentPolyline);
      currentPolyline = [];
      currentStartPoint = null;
    }
  }

  // Don't forget to add the last polyline if it wasn't closed
  if (currentPolyline.length > 0) {
    polylines.push(currentPolyline);
  }

  // If there's only one polyline, return it directly for backwards compatibility
  return polylines;
}
