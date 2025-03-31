import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawTempPath(state) {
  const { currentPath, currentPoint } = state;

  if (!currentPath) return "";

  let pathData = "";
  currentPath.data.forEach((cmd) => {
    if (cmd.cmd === "start") {
      pathData += `M ${state.params[cmd.x]} ${state.params[cmd.y]} `;
    } else if (cmd.cmd === "line") {
      pathData += `L ${state.params[cmd.x]} ${state.params[cmd.y]} `;
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
