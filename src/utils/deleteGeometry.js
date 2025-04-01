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
        toRemove.add(g.id);
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
      // First collect all points that are used in commands that don't reference selected points
      const validCommands = [];
      g.data.forEach((cmd) => {
        const referencesSelectedPoint =
          (cmd.point && selectedPoints.has(cmd.point)) ||
          (cmd.control1 && selectedPoints.has(cmd.control1)) ||
          (cmd.control2 && selectedPoints.has(cmd.control2));

        if (!referencesSelectedPoint) {
          validCommands.push(cmd);
          if (cmd.point) usedPoints.add(cmd.point);
          if (cmd.control1) usedPoints.add(cmd.control1);
          if (cmd.control2) usedPoints.add(cmd.control2);
        }
      });

      // If we have valid commands, update the path data
      if (validCommands.length > 1) {
        // Make sure the first command is a 'move' command
        if (validCommands[0].cmd !== "move" && validCommands.length > 0) {
          validCommands[0] = {
            x: validCommands[0].x,
            y: validCommands[0].y,
            cmd: "move",
          };
        }

        // Check if path only contains move and close commands
        const onlyMoveAndClose = validCommands.every(
          (cmd) => cmd.cmd === "move" || cmd.cmd === "close"
        );

        if (onlyMoveAndClose) {
          // Remove path if it's just move and close
          toRemove.add(g.id);
        } else {
          g.data = validCommands;
        }
      } else {
        // If no valid commands remain, mark the path for removal
        toRemove.add(g.id);
      }
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
