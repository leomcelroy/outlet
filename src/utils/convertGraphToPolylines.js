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
    const curvePoints = [];
    // Determine if the path is closed by checking if the first and last ids are equal.
    const isClosed = ids[0] === ids[ids.length - 1];

    for (let i = 0; i < ids.length; i++) {
      const point = points.find((p) => p.id === ids[i]);

      // For open paths, treat endpoints as straight (ignore curves)
      if (!isClosed && (i === 0 || i === ids.length - 1)) {
        curvePoints.push({
          type: "point",
          coords: getPointCoords(point.id),
        });
        continue;
      }

      // For closed paths or internal points in an open path, compute previous and next with wrap-around.
      let prevIndex = i - 1;
      if (prevIndex < 0) prevIndex = ids.length - 1;
      let nextIndex = i + 1;
      if (nextIndex >= ids.length) nextIndex = 0;
      const prevPoint = points.find((p) => p.id === ids[prevIndex]);
      const nextPoint = points.find((p) => p.id === ids[nextIndex]);

      if (point.cornerType === "straight") {
        curvePoints.push({
          type: "point",
          coords: getPointCoords(point.id),
          current: point.id,
          prev: prevPoint.id,
          next: nextPoint.id,
        });
      } else if (point.cornerType === "curvy") {
        if (isClosed && i === ids.length - 1) {
          continue;
        }

        const current = getPointCoords(point.id);
        const prev = getPointCoords(prevPoint.id);
        const next = getPointCoords(nextPoint.id);

        // Set p0 and p3 as the midpoints of the segments leading into and out of the current point.
        const p0 = [(prev[0] + current[0]) / 2, (prev[1] + current[1]) / 2];
        const p3 = [(current[0] + next[0]) / 2, (current[1] + next[1]) / 2];
        // Set control points as midpoints between p0/current and p3/current respectively.
        const p1 = [(p0[0] + current[0]) / 2, (p0[1] + current[1]) / 2];
        const p2 = [(p3[0] + current[0]) / 2, (p3[1] + current[1]) / 2];

        curvePoints.push({
          type: "curve",
          p0,
          p1,
          p2,
          p3,
          i,
          prevIndex,
          nextIndex,
          current: point.id,
          prev: prevPoint.id,
          next: nextPoint.id,
        });
      }
    }

    console.log({ curvePoints });

    // Interpolate points and curves.
    for (let i = 0; i < curvePoints.length; i++) {
      const current = curvePoints[i];
      const next = curvePoints[(i + 1) % curvePoints.length];

      if (current.type === "point") {
        coords.push(current.coords);
      } else if (current.type === "curve") {
        const steps = 10;
        for (let t = 0; t <= 1; t += 1 / steps) {
          const x = cubicBezier(
            t,
            current.p0[0],
            current.p1[0],
            current.p2[0],
            current.p3[0]
          );
          const y = cubicBezier(
            t,
            current.p0[1],
            current.p1[1],
            current.p2[1],
            current.p3[1]
          );
          coords.push([x, y]);
        }
      }
    }

    // For closed paths, ensure the last point connects back to the first
    if (isClosed && coords.length > 0) {
      coords.push(coords[0]);
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
