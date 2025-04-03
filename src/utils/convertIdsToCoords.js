export function convertIdsToCoords(ids, points, params) {
  function getPointCoords(pointId) {
    const point = points.find((p) => p.id === pointId);
    return [params[point.x], params[point.y]];
  }

  const coords = [];
  const segments = [];
  const isClosed = ids[0] === ids[ids.length - 1];
  // For closed paths, ignore duplicate last id.
  const n = isClosed ? ids.length - 1 : ids.length;

  for (let i = 0; i < n; i++) {
    const id = ids[i];
    const point = points.find((p) => p.id === id);

    if (
      point.cornerType === "straight" ||
      (!isClosed && (i === 0 || i === n - 1))
    ) {
      segments.push({ type: "point", coords: getPointCoords(point.id) });
    } else if (point.cornerType === "curvy") {
      const prevIndex = isClosed ? (i - 1 + n) % n : i - 1;
      const nextIndex = isClosed ? (i + 1) % n : i + 1;
      const prevPoint = points.find((p) => p.id === ids[prevIndex]);
      const nextPoint = points.find((p) => p.id === ids[nextIndex]);
      const current = getPointCoords(point.id);
      const prev = getPointCoords(prevPoint.id);
      const next = getPointCoords(nextPoint.id);
      const corner = point.cornerValue !== undefined ? point.cornerValue : 0.2;
      const vIn = [current[0] - prev[0], current[1] - prev[1]];
      const vOut = [next[0] - current[0], next[1] - current[1]];
      const p0 = [current[0] - vIn[0] * corner, current[1] - vIn[1] * corner];
      const p3 = [current[0] + vOut[0] * corner, current[1] + vOut[1] * corner];
      const kappa = 0.5522847498307936;
      const p1 = [
        p0[0] + (current[0] - p0[0]) * kappa,
        p0[1] + (current[1] - p0[1]) * kappa,
      ];
      const p2 = [
        p3[0] + (current[0] - p3[0]) * kappa,
        p3[1] + (current[1] - p3[1]) * kappa,
      ];
      segments.push({ type: "curve", p0, p1, p2, p3 });
    }
  }

  // Sample segments, handling first segment specially if it’s a curve.
  segments.forEach((segment) => {
    if (segment.type === "point") {
      if (coords.length === 0) {
        coords.push(segment.coords);
      } else {
        sampleLine(coords, segment.coords, 16);
      }
    } else if (segment.type === "curve") {
      if (coords.length === 0) {
        coords.push(segment.p0);
      } else {
        const last = coords[coords.length - 1];
        if (!pointsEqual(last, segment.p0)) {
          sampleLine(coords, segment.p0, 8);
        }
      }
      sampleCurve(coords, segment, 32);
    }
  });

  // For closed paths, ensure the path connects back to the start.
  if (isClosed) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (!pointsEqual(last, first)) {
      sampleLine(coords, first, 16);
    }
  }

  return coords;
}

function sampleLine(coords, toPoint, steps) {
  const last = coords[coords.length - 1];
  for (let t = 1 / steps; t <= 1; t += 1 / steps) {
    const x = last[0] + (toPoint[0] - last[0]) * t;
    const y = last[1] + (toPoint[1] - last[1]) * t;
    coords.push([x, y]);
  }
}

function sampleCurve(coords, segment, steps) {
  for (let t = 1 / steps; t <= 1; t += 1 / steps) {
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

function cubicBezier(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

function pointsEqual(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
}
