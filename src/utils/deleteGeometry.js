import { getPathPoints } from "./getPathPoints.js";

export function deleteGeometry(state) {
  const toRemove = new Set();

  // Add selected geometry to removal set
  state.selectedGeometry.forEach((id) => {
    toRemove.add(id);
  });

  // Find all selected points
  const selectedPoints = new Set();
  state.geometries.forEach((g) => {
    if (g.type === "point" && state.selectedGeometry.has(g.id)) {
      selectedPoints.add(g.id);
    }
  });

  // Add geometry that references selected points to removal set
  state.geometries.forEach((g) => {
    if (g.type === "line") {
      if (
        selectedPoints.has(g.p1) ||
        selectedPoints.has(g.p2) ||
        toRemove.has(g.p1) ||
        toRemove.has(g.p2)
      ) {
        toRemove.add(g.id);
      }
    } else if (g.type === "path") {
      // Filter out commands that reference selected points
      const pathPoints = getPathPoints(g);
      const hasSelectedPoints = Array.from(pathPoints).some(
        (pointId) => selectedPoints.has(pointId) || toRemove.has(pointId)
      );

      if (hasSelectedPoints) {
        // Filter out commands that reference selected points
        const validCommands = g.data.filter((cmd) => {
          return !(
            (cmd.point && selectedPoints.has(cmd.point)) ||
            (cmd.control1 && selectedPoints.has(cmd.control1)) ||
            (cmd.control2 && selectedPoints.has(cmd.control2))
          );
        });

        // If we have valid commands, update the path data
        if (validCommands.length > 0) {
          // Make sure the first command is a 'move' command
          if (validCommands[0].cmd !== "move") {
            validCommands[0] = {
              point: validCommands[0].point,
              cmd: "move",
            };
          }

          // Filter out consecutive close commands
          const filteredCommands = validCommands.filter((cmd, index, array) => {
            if (cmd.cmd !== "close") return true;
            // Keep the close command if the previous command isn't also a close
            return index === 0 || array[index - 1].cmd !== "close";
          });

          // Check if path has any line commands (not just move/close)
          const hasLineCommands = filteredCommands.some(
            (cmd) => cmd.cmd !== "move" && cmd.cmd !== "close"
          );

          if (hasLineCommands) {
            g.data = filteredCommands;
          } else {
            toRemove.add(g.id);
          }
        } else {
          toRemove.add(g.id);
        }
      }
    }
  });

  // Find points not referenced by any remaining geometry
  const usedPoints = new Set();
  state.geometries.forEach((g) => {
    if (toRemove.has(g.id)) return;

    if (g.type === "line") {
      usedPoints.add(g.p1);
      usedPoints.add(g.p2);
    } else if (g.type === "path") {
      // Add all points used in the path commands
      g.data.forEach((cmd) => {
        if (cmd.point) usedPoints.add(cmd.point);
        if (cmd.control1) usedPoints.add(cmd.control1);
        if (cmd.control2) usedPoints.add(cmd.control2);
      });
    }
  });

  // Add unused points to removal set
  state.geometries.forEach((g) => {
    if (g.type === "point" && !usedPoints.has(g.id)) {
      toRemove.add(g.id);
    }
  });

  // Remove all marked geometry
  state.geometries = state.geometries.filter((g) => !toRemove.has(g.id));

  // If currentPath is being removed, clear it
  if (state.currentPath && toRemove.has(state.currentPath.id)) {
    state.currentPath = null;
    state.currentPoint = null;
  }

  // If editingPath is being removed, clear it
  if (state.editingPath && toRemove.has(state.editingPath)) {
    state.editingPath = null;
    state.selectedGeometry = new Set();
  }

  // Clean up unused parameters
  const usedParams = new Set();
  state.geometries.forEach((g) => {
    if (g.type !== "point") return;
    usedParams.add(g.x);
    usedParams.add(g.y);
  });

  for (const param in state.params) {
    if (!usedParams.has(param)) delete state.params[param];
  }
}
