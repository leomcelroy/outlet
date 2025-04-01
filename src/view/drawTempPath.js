import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawTempPath(state) {
  const { currentPath, currentPoint } = state;

  if (!currentPath) return "";

  let pathData = "";
  currentPath.data.forEach((cmd) => {
    if (cmd.cmd === "move" || cmd.cmd === "line") {
      const point = state.geometries.find((g) => g.id === cmd.point);
      const x = state.params[point.x];
      const y = state.params[point.y];
      pathData += `${cmd.cmd === "move" ? "M" : "L"} ${x} ${y} `;
    } else if (cmd.cmd === "close") {
      pathData += "Z ";
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
