export function convertPathToPolyline(pathData) {
  if (!pathData || !Array.isArray(pathData) || pathData.length === 0) {
    return [];
  }

  const polyline = [];
  let startPoint = null;

  for (const segment of pathData) {
    if (segment.cmd === "start") {
      // Add the starting point
      polyline.push([segment.x, segment.y]);
      startPoint = [segment.x, segment.y];
    } else if (segment.cmd === "line") {
      // Add line points
      polyline.push([segment.x, segment.y]);
    } else if (segment.cmd === "close" && startPoint) {
      // For "close" command, add the starting point again to close the path
      // Only add if we're not already at the start point
      const lastPoint = polyline[polyline.length - 1];
      if (lastPoint[0] !== startPoint[0] || lastPoint[1] !== startPoint[1]) {
        polyline.push([startPoint[0], startPoint[1]]);
      }
    }
  }

  return polyline;
}
