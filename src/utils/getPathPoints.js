export function getPathPoints(path) {
  const points = new Set();

  path.data.forEach((cmd) => {
    if (cmd.point) {
      points.add(cmd.point);
    }
    if (cmd.control1) {
      points.add(cmd.control1);
    }
    if (cmd.control2) {
      points.add(cmd.control2);
    }
  });

  return points;
}
