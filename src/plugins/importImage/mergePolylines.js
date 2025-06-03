export function mergePolylines(polylines) {
  if (polylines.length === 0) return [];

  const arePointsEqual = ([x1, y1], [x2, y2]) => {
    return x1 === x2 && y1 === y2;
  };

  // Function to check if three points are colinear within a tolerance
  const areColinear = (p1, p2, p3, tolerance = 0.01) => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    // Calculate cross product to determine if points are colinear
    // If cross product is 0 (or close to 0), points are colinear
    const crossProduct = Math.abs(
      (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)
    );
    return crossProduct < tolerance;
  };

  // Function to simplify a polyline by removing colinear points
  const simplifyPolyline = (polyline) => {
    if (polyline.length <= 2) return polyline;

    const simplified = [polyline[0]]; // Always keep first point

    for (let i = 1; i < polyline.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = polyline[i];
      const next = polyline[i + 1];

      // If current point is not colinear with previous and next, keep it
      if (!areColinear(prev, curr, next)) {
        simplified.push(curr);
      }
      // Otherwise skip the current point (it's redundant)
    }

    simplified.push(polyline[polyline.length - 1]); // Always keep last point
    return simplified;
  };

  let stack = [...polylines];
  let finalLines = [];

  while (stack.length > 0) {
    let current = stack[0];
    let foundMerge = false;

    // Get endpoints of current line
    const currStart = current[0];
    const currEnd = current[current.length - 1];

    // Check against all other lines in stack
    for (let i = 1; i < stack.length; i++) {
      const other = stack[i];
      const otherStart = other[0];
      const otherEnd = other[other.length - 1];

      // Check all possible connections and maintain direction
      if (arePointsEqual(currEnd, otherStart)) {
        // Append other in its original direction
        stack[0] = [...current, ...other.slice(1)];
        stack.splice(i, 1);
        foundMerge = true;
        break;
      } else if (arePointsEqual(currStart, otherEnd)) {
        // Prepend other in its original direction
        stack[0] = [...other, ...current.slice(1)];
        stack.splice(i, 1);
        foundMerge = true;
        break;
      } else if (arePointsEqual(currStart, otherStart)) {
        // Prepend reversed other to ensure same direction
        stack[0] = [...other.slice().reverse(), ...current.slice(1)];
        stack.splice(i, 1);
        foundMerge = true;
        break;
      } else if (arePointsEqual(currEnd, otherEnd)) {
        // Append reversed other to ensure same direction
        stack[0] = [...current, ...other.slice().reverse().slice(1)];
        stack.splice(i, 1);
        foundMerge = true;
        break;
      }
    }

    // If no merge found, move current line to final lines
    if (!foundMerge) {
      finalLines.push(current);
      stack.splice(0, 1);
    }
  }

  // Simplify all polylines by removing colinear points
  const simplifiedLines = finalLines.map(simplifyPolyline);

  return simplifiedLines;
}
