import { convertIdsToCoords } from "./convertIdsToCoords.js";

export function convertGraphToPolylines(geometries, params) {
  const points = geometries.filter((g) => g.type === "point");
  const edges = geometries.filter((g) => g.type === "edge" && g.p1 !== g.p2);

  const adjacencyList = new Map();
  points.forEach((point) => {
    adjacencyList.set(point.id, []);
  });
  edges.forEach((edge) => {
    adjacencyList.get(edge.p1).push(edge.p2);
    adjacencyList.get(edge.p2).push(edge.p1);
  });

  const usedEdges = new Set();
  const polylines = [];

  // Helper to get unused edges connected to a point
  function getUnusedEdges(pointId) {
    return adjacencyList.get(pointId).filter((neighbor) => {
      const edgeKey = [pointId, neighbor].sort().join(",");
      return !usedEdges.has(edgeKey);
    });
  }

  // Helper to get any unused edge that can be connected to a point
  function getConnectableEdges(pointId) {
    const connectable = [];
    for (const edge of edges) {
      const edgeKey = [edge.p1, edge.p2].sort().join(",");
      if (usedEdges.has(edgeKey)) continue;

      if (edge.p1 === pointId || edge.p2 === pointId) {
        connectable.push(edge);
      }
    }
    return connectable;
  }

  // --- First Pass: Find all cycles ---
  for (const point of points) {
    const cycle = findCycle(point.id);
    if (cycle && cycle.length >= 4) {
      for (let i = 0; i < cycle.length - 1; i++) {
        const edgeKey = [cycle[i], cycle[i + 1]].sort().join(",");
        usedEdges.add(edgeKey);
      }
      polylines.push(convertIdsToCoords(cycle, points, params));
    }
  }

  // --- Second Pass: Find all chains ---
  for (const point of points) {
    const chain = findChain(point.id);
    if (chain.length >= 2) {
      for (let i = 0; i < chain.length - 1; i++) {
        const edgeKey = [chain[i], chain[i + 1]].sort().join(",");
        usedEdges.add(edgeKey);
      }
      polylines.push(convertIdsToCoords(chain, points, params));
    }
  }

  return polylines;

  // DFS to find a cycle starting and ending at the same point
  function findCycle(startPoint) {
    const dfs = (current, start, path, visited) => {
      const unusedEdges = getUnusedEdges(current);

      for (const next of unusedEdges) {
        if (next === start && path.length >= 2) {
          return [...path, start];
        }
        if (!visited.has(next)) {
          visited.add(next);
          path.push(next);
          const result = dfs(next, start, path, visited);
          if (result) return result;
          path.pop();
          visited.delete(next);
        }
      }
      return null;
    };
    return dfs(startPoint, startPoint, [startPoint], new Set([startPoint]));
  }

  // Find a chain starting from a point by connecting any unused edges
  function findChain(startPoint) {
    const chain = [startPoint];

    outer: while (true) {
      const start = chain[0];
      const end = chain[chain.length - 1];

      // Get unused edges connected to either end of the chain
      const startEdges = getConnectableEdges(start);
      const endEdges = getConnectableEdges(end);

      if (startEdges.length === 0 && endEdges.length === 0) break;

      // Try to connect edges to the start of the chain
      for (const edge of startEdges) {
        const nextPoint = edge.p1 === start ? edge.p2 : edge.p1;
        chain.unshift(nextPoint);
        const edgeKey = [edge.p1, edge.p2].sort().join(",");
        usedEdges.add(edgeKey);
        continue outer;
      }

      // Try to connect edges to the end of the chain
      for (const edge of endEdges) {
        const nextPoint = edge.p1 === end ? edge.p2 : edge.p1;
        chain.push(nextPoint);
        const edgeKey = [edge.p1, edge.p2].sort().join(",");
        usedEdges.add(edgeKey);
        continue outer;
      }
    }

    return chain;
  }
}
