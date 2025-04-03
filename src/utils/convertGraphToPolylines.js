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
      const polyline = convertIdsToCoords(cycle);
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
    const polyline = convertIdsToCoords(chain);
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

  function getPointCoords(pointId) {
    const point = points.find((p) => p.id === pointId);
    return [params[point.x], params[point.y]];
  }

  function convertIdsToCoords(ids) {
    const coords = [];
    const segments = [];
    // Determine if the path is closed (first and last id are the same).
    const isClosed = ids[0] === ids[ids.length - 1];

    // For closed paths, ignore the duplicate endpoint.
    const effectiveIds = isClosed ? ids.slice(0, -1) : ids;

    // Build segments array
    for (let i = 0; i < effectiveIds.length; i++) {
      const id = effectiveIds[i];
      const point = points.find((p) => p.id === id);

      // For open paths, force endpoints as straight.
      if (!isClosed && (i === 0 || i === effectiveIds.length - 1)) {
        segments.push({
          type: "point",
          coords: getPointCoords(point.id),
        });
        continue;
      }

      // Compute neighbors with wrap-around.
      let prevIndex = i - 1;
      if (prevIndex < 0) prevIndex = effectiveIds.length - 1;
      let nextIndex = i + 1;
      if (nextIndex >= effectiveIds.length) nextIndex = 0;
      const prevPoint = points.find((p) => p.id === effectiveIds[prevIndex]);
      const nextPoint = points.find((p) => p.id === effectiveIds[nextIndex]);

      if (point.cornerType === "straight") {
        segments.push({
          type: "point",
          coords: getPointCoords(point.id),
        });
      } else if (point.cornerType === "curvy") {
        const current = getPointCoords(point.id);
        const prev = getPointCoords(prevPoint.id);
        const next = getPointCoords(nextPoint.id);

        // Calculate the corner value, defaulting to 0.5 if not specified
        const corner =
          point.cornerValue !== undefined ? point.cornerValue : 0.5;

        // p0 and p3 are points along the adjacent segments, controlled by corner value
        const p0 = [
          prev[0] + (current[0] - prev[0]) * corner,
          prev[1] + (current[1] - prev[1]) * corner,
        ];
        const p3 = [
          current[0] + (next[0] - current[0]) * corner,
          current[1] + (next[1] - current[1]) * corner,
        ];

        // Control points are interpolated between current and p0/p3
        const p1 = [
          p0[0] + (current[0] - p0[0]) * corner,
          p0[1] + (current[1] - p0[1]) * corner,
        ];
        const p2 = [
          p3[0] + (current[0] - p3[0]) * corner,
          p3[1] + (current[1] - p3[1]) * corner,
        ];

        segments.push({
          type: "curve",
          p0,
          p1,
          p2,
          p3,
        });
      }
    }

    // Interpolate each segment.
    segments.forEach((segment) => {
      if (segment.type === "point") {
        coords.push(segment.coords);
      } else if (segment.type === "curve") {
        const steps = 10;
        for (let t = 0; t <= 1; t += 1 / steps) {
          const x = cubicBezier(
            t,
            segment.p0[0],
            segment.p1[0],
            segment.p2[0],
            segment.p3[0]
          );
          const y = cubicBezier(
            t,
            segment.p0[1],
            segment.p1[1],
            segment.p2[1],
            segment.p3[1]
          );
          coords.push([x, y]);
        }
      }
    });

    // For closed paths, ensure the shape is properly closed.
    if (isClosed && coords.length > 0) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }
    }

    return coords;
  }

  function cubicBezier(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    return (
      mt * mt * mt * p0 +
      3 * mt * mt * t * p1 +
      3 * mt * t * t * p2 +
      t * t * t * p3
    );
  }
}
