export function deleteGeometry(state) {
  const toRemove = new Set();

  // Add selected geometry to removal set
  state.selectedGeometry.forEach((id) => {
    toRemove.add(id);
  });

  // Add lines that reference removed geometry
  state.geometries.forEach((g) => {
    if (g.type === "line") {
      if (toRemove.has(g.p1) || toRemove.has(g.p2)) {
        toRemove.add(g.id);
      }
    }
  });

  // Find points not referenced by any remaining lines
  const usedPoints = new Set();
  state.geometries.forEach((g) => {
    if (g.type === "line" && !toRemove.has(g.id)) {
      usedPoints.add(g.p1);
      usedPoints.add(g.p2);
    }
  });

  state.geometries.forEach((g) => {
    if (g.type === "point" && !usedPoints.has(g.id)) {
      toRemove.add(g.id);
    }
  });

  // Remove all marked geometry
  state.geometries = state.geometries.filter((g) => !toRemove.has(g.id));

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
