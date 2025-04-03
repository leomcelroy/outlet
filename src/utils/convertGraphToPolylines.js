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

  // Helper: Returns true if the point has at least one adjacent edge that hasn't been used.
  function hasUnusedEdge(pointId) {
    return adjacencyList.get(pointId).some((neighbor) => {
      const edgeKey = [pointId, neighbor].sort().join(",");
      return !usedEdges.has(edgeKey);
    });
  }

  // --- First Pass: Find all cycles ---
  for (const point of points) {
    if (!hasUnusedEdge(point.id)) continue;
    const cycle = findCycle(point.id);
    if (cycle && cycle.length >= 4) {
      for (let i = 0; i < cycle.length - 1; i++) {
        const edgeKey = [cycle[i], cycle[i + 1]].sort().join(",");
        usedEdges.add(edgeKey);
      }
      polylines.push(convertIdsToCoords(cycle, points, params));
    }
  }

  // --- Second Pass: Find chains from points that didn't participate in a cycle ---
  for (const point of points) {
    if (!hasUnusedEdge(point.id)) continue;
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

  // DFS to find a cycle starting and ending at the same point.
  function findCycle(startPoint) {
    const dfs = (current, start, path, visited, usedInThisCycle) => {
      for (const next of adjacencyList.get(current)) {
        const edgeKey = [current, next].sort().join(",");
        if (usedEdges.has(edgeKey) || usedInThisCycle.has(edgeKey)) continue;
        if (next === start && path.length >= 2) return [...path, start];
        if (!visited.has(next)) {
          visited.add(next);
          path.push(next);
          usedInThisCycle.add(edgeKey);
          const result = dfs(next, start, path, visited, usedInThisCycle);
          if (result) return result;
          path.pop();
          visited.delete(next);
          usedInThisCycle.delete(edgeKey);
        }
      }
      return null;
    };
    return dfs(
      startPoint,
      startPoint,
      [startPoint],
      new Set([startPoint]),
      new Set()
    );
  }

  // Greedy DFS to extend a chain as far as possible.
  function findChain(startPoint) {
    let current = startPoint;
    const path = [startPoint];
    const visited = new Set([startPoint]);

    while (true) {
      let extended = false;
      const neighbors = adjacencyList.get(current);
      for (const next of neighbors) {
        const edgeKey = [current, next].sort().join(",");
        if (usedEdges.has(edgeKey)) continue;
        if (!visited.has(next)) {
          visited.add(next);
          path.push(next);
          current = next;
          extended = true;
          break;
        }
      }
      if (!extended) {
        // Optionally try to extend backwards if possible.
        if (path.length > 1) {
          const prev = path[path.length - 2];
          const edgeKey = [prev, current].sort().join(",");
          if (!usedEdges.has(edgeKey) && !visited.has(prev)) {
            visited.add(prev);
            path.unshift(prev);
            current = prev;
            extended = true;
          }
        }
      }
      if (!extended) break;
    }
    return path;
  }
}
