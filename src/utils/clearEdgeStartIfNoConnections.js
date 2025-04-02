export function clearEdgeStartIfNoConnections(state) {
  if (state.edgeStart) {
    const hasConnectedEdges = state.geometries.some(
      (geo) =>
        geo.type === "edge" &&
        (geo.p1 === state.edgeStart || geo.p2 === state.edgeStart)
    );
    if (!hasConnectedEdges) {
      // Find and remove the point at edgeStart
      const pointIndex = state.geometries.findIndex(
        (geo) => geo.type === "point" && geo.id === state.edgeStart
      );
      if (pointIndex !== -1) {
        state.geometries.splice(pointIndex, 1);
      }
      state.edgeStart = null;
    }
  }
}
