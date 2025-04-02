export function convertGraphToPolylines(geometries, params) {
  // Extract points and edges
  const points = geometries.filter((g) => g.type === "point");
  const edges = geometries.filter((g) => g.type === "edge" && g.p1 !== g.p2); // Ignore loops

  // Create adjacency list for faster graph traversal
  const adjacencyList = new Map();
  points.forEach((point) => {
    adjacencyList.set(point.id, []);
  });

  edges.forEach((edge) => {
    adjacencyList.get(edge.p1).push(edge.p2);
    adjacencyList.get(edge.p2).push(edge.p1);
  });

  // Keep track of used edges
  const usedEdges = new Set();

  // Function to get point coordinates
  const getPointCoords = (pointId) => {
    const point = points.find((p) => p.id === pointId);
    return [params[point.x], params[point.y]];
  };

  // Function to find the largest cycle starting from a point
  const findLargestCycle = (
    startPoint,
    currentPath = [],
    visited = new Set()
  ) => {
    if (currentPath.length > 0 && startPoint === currentPath[0]) {
      // Only return cycles with at least 3 points
      if (currentPath.length >= 3) {
        return [...currentPath, startPoint];
      }
      return null;
    }

    visited.add(startPoint);
    currentPath.push(startPoint);

    let maxCycle = null;
    let maxLength = 0;

    for (const nextPoint of adjacencyList.get(startPoint)) {
      // Skip if we've already used this edge
      const edgeKey = [startPoint, nextPoint].sort().join(",");
      if (usedEdges.has(edgeKey)) continue;

      // Skip if we've visited this point (unless it's our start point)
      if (visited.has(nextPoint) && nextPoint !== currentPath[0]) continue;

      const cycle = findLargestCycle(
        nextPoint,
        [...currentPath],
        new Set(visited)
      );
      if (cycle && cycle.length > maxLength) {
        maxCycle = cycle;
        maxLength = cycle.length;
      }
    }

    return maxCycle;
  };

  // Function to find the longest chain starting from a point
  const findLongestChain = (
    startPoint,
    currentPath = [],
    visited = new Set()
  ) => {
    visited.add(startPoint);
    currentPath.push(startPoint);

    let maxChain = [...currentPath];
    let maxLength = currentPath.length;

    for (const nextPoint of adjacencyList.get(startPoint)) {
      // Skip if we've already used this edge
      const edgeKey = [startPoint, nextPoint].sort().join(",");
      if (usedEdges.has(edgeKey)) continue;

      // Skip if we've visited this point
      if (visited.has(nextPoint)) continue;

      const chain = findLongestChain(
        nextPoint,
        [...currentPath],
        new Set(visited)
      );
      if (chain.length > maxLength) {
        maxChain = chain;
        maxLength = chain.length;
      }
    }

    return maxChain;
  };

  const polylines = [];

  // First find all cycles
  while (true) {
    // Find an unused edge to start from
    let startEdge = null;
    for (const edge of edges) {
      const edgeKey = [edge.p1, edge.p2].sort().join(",");
      if (!usedEdges.has(edgeKey)) {
        startEdge = edge;
        break;
      }
    }

    if (!startEdge) break;

    // Find the largest cycle starting from this edge
    const cycle = findLargestCycle(startEdge.p1);
    if (!cycle) break;

    // Convert cycle to polyline coordinates
    const polyline = cycle.map((pointId) => getPointCoords(pointId));
    polylines.push(polyline);

    // Mark edges as used
    for (let i = 0; i < cycle.length - 1; i++) {
      const current = cycle[i];
      const next = cycle[i + 1];
      const edgeKey = [current, next].sort().join(",");
      usedEdges.add(edgeKey);
    }
  }

  // Then find all longest chains from remaining edges
  while (true) {
    // Find an unused edge to start from
    let startEdge = null;
    for (const edge of edges) {
      const edgeKey = [edge.p1, edge.p2].sort().join(",");
      if (!usedEdges.has(edgeKey)) {
        startEdge = edge;
        break;
      }
    }

    if (!startEdge) break;

    // Find the longest chain starting from this edge
    const chain = findLongestChain(startEdge.p1);
    if (chain.length < 2) continue; // Skip single points

    // Convert chain to polyline coordinates
    const polyline = chain.map((pointId) => getPointCoords(pointId));
    polylines.push(polyline);

    // Mark edges as used
    for (let i = 0; i < chain.length - 1; i++) {
      const current = chain[i];
      const next = chain[i + 1];
      const edgeKey = [current, next].sort().join(",");
      usedEdges.add(edgeKey);
    }
  }

  return polylines;
}
