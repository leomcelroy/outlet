import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawTempPath(state) {
  const { currentPath, currentPoint } = state;

  if (!currentPath) return "";

  let pathData = "";
  currentPath.data.forEach((cmd) => {
    if (cmd.cmd === "start") {
      const point = state.geometries.find((g) => g.id === cmd.point);
      pathData += `M ${state.params[point.x]} ${state.params[point.y]} `;
    } else if (cmd.cmd === "line") {
      const point = state.geometries.find((g) => g.id === cmd.point);
      pathData += `L ${state.params[point.x]} ${state.params[point.y]} `;
    }
  });

  // Add temporary line to current mouse position if we're drawing
  if (currentPoint) {
    pathData += `L ${currentPoint.x} ${currentPoint.y}`;
  }

  return svg`
    <path
      d=${pathData}
      fill="none"
      stroke="blue"
      stroke-width=${PT_SIZE * 0.6}
      vector-effect="non-scaling-stroke"
    />
  `;
}
