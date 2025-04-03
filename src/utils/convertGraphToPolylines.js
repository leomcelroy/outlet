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

  // Process cycles using the first available unused edge.
  while (true) {
    let startEdge = null;
    for (const edge of edges) {
      const edgeKey = [edge.p1, edge.p2].sort().join(",");
      if (!usedEdges.has(edgeKey)) {
        startEdge = edge;
        break;
      }
    }
    if (!startEdge) break;

    const cycle = findCycle(startEdge.p1);
    if (cycle && cycle.length >= 4) {
      const polyline = convertIdsToCoords(cycle, points, params);
      polylines.push(polyline);
      for (let i = 0; i < cycle.length - 1; i++) {
        const edgeKey = [cycle[i], cycle[i + 1]].sort().join(",");
        usedEdges.add(edgeKey);
      }
    } else {
      break;
    }
  }

  // Process chains from remaining unused edges.
  while (true) {
    let startEdge = null;
    for (const edge of edges) {
      const edgeKey = [edge.p1, edge.p2].sort().join(",");
      if (!usedEdges.has(edgeKey)) {
        startEdge = edge;
        break;
      }
    }
    if (!startEdge) break;

    const chain = findChain(startEdge.p1);
    if (chain.length < 2) {
      usedEdges.add([startEdge.p1, startEdge.p2].sort().join(","));
      continue;
    }
    const polyline = convertIdsToCoords(chain, points, params);
    polylines.push(polyline);
    for (let i = 0; i < chain.length - 1; i++) {
      const edgeKey = [chain[i], chain[i + 1]].sort().join(",");
      usedEdges.add(edgeKey);
    }
  }

  return polylines;

  // Greedy DFS to extend a chain as far as possible.
  function findChain(startPoint) {
    let current = startPoint;
    const path = [startPoint];
    const visited = new Set([startPoint]);

    while (true) {
      let extended = false;
      const neighbors = adjacencyList.get(current);

      // Try to extend in both directions
      for (const next of neighbors) {
        const edgeKey = [current, next].sort().join(",");
        if (usedEdges.has(edgeKey)) continue;

        // Check if we can extend the chain in either direction
        if (!visited.has(next)) {
          visited.add(next);
          path.push(next);
          current = next;
          extended = true;
          break;
        }
      }

      if (!extended) {
        // If we couldn't extend forward, try to extend backward
        if (path.length > 1) {
          const prev = path[path.length - 2];
          const edgeKey = [prev, current].sort().join(",");
          if (!usedEdges.has(edgeKey) && !visited.has(prev)) {
            // We can extend backward
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

  // DFS to find a cycle starting from a given point.
  function findCycle(startPoint) {
    const dfs = (current, start, path, visited, usedInThisCycle) => {
      for (const next of adjacencyList.get(current)) {
        const edgeKey = [current, next].sort().join(",");
        // Skip if edge was used in any cycle or in this cycle
        if (usedEdges.has(edgeKey) || usedInThisCycle.has(edgeKey)) continue;

        if (next === start && path.length >= 2) {
          return [...path, start];
        }
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
}
