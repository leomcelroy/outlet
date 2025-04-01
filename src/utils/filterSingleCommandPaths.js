export function filterSingleCommandPaths(state) {
  // Filter out paths that only have one command
  state.geometries = state.geometries.filter((geometry) => {
    if (geometry.type !== "path") return true;

    // Count non-close commands
    const nonCloseCommands = geometry.data.filter((cmd) => cmd.cmd !== "close");

    // Keep paths with more than one command
    return nonCloseCommands.length > 1;
  });

  // Clean up any unused points
  const usedPoints = new Set();
  state.geometries.forEach((g) => {
    if (g.type === "path") {
      g.data.forEach((cmd) => {
        if (cmd.point) usedPoints.add(cmd.point);
        if (cmd.control1) usedPoints.add(cmd.control1);
        if (cmd.control2) usedPoints.add(cmd.control2);
      });
    }
  });

  // Remove unused points
  state.geometries = state.geometries.filter((g) => {
    if (g.type !== "point") return true;
    return usedPoints.has(g.id);
  });

  // Clean up unused parameters
  const usedParams = new Set();
  state.geometries.forEach((g) => {
    if (g.type === "point") {
      usedParams.add(g.x);
      usedParams.add(g.y);
    }
  });

  for (const param in state.params) {
    if (!usedParams.has(param)) delete state.params[param];
  }
}
