// Leo McElroy (c) 2024

import { lusolve } from "./lusolve.js";
import * as m from "./matrix.js";

export function dogLeg(
  getValDers,
  x0,
  { delta0 = null, epsilon, maxSteps } = {},
) {
  let k = 0;
  let kMax = maxSteps || 1000;
  let epsilon1 = epsilon || 1e-8;
  let epsilon2 = epsilon || 1e-8;
  let epsilon3 = epsilon || 1e-8;
  let x = x0;
  let valDers = getValDers(x);
  let f_x = valDers.vals;

  if (f_x.length === 0) return x0;

  let J_x = valDers.jacobian;
  let g = m.multiplyMatrixVector(m.transposeMatrix(J_x), f_x);
  let delta = delta0 || normInf(g) * 0.5;

  let found = normInf(f_x) <= epsilon3 || normInf(g) <= epsilon1;

  while (!found && k < kMax) {
    k += 1;

    let hgn = solveNormalEquations(J_x, f_x);

    let alpha = safeDivide(m.norm2(g), m.norm2(m.multiplyMatrixVector(J_x, g)));

    let hsd = m.scaleVector(g, -1 * alpha);

    let hdl = computeHdl(hsd, hgn, alpha, delta);

    if (m.norm(hdl) <= epsilon2 * (m.norm(x) + epsilon2)) {
      found = true;
    } else {
      let x_new = m.addVectors(x, hdl);
      let F_x = 0.5 * m.norm2(f_x);
      let F_x_new = 0.5 * m.norm2(getValDers(x_new, true));
      let L_0 = F_x;
      let L_hdl = computeL(f_x, J_x, hdl);

      let rho = safeDivide(F_x - F_x_new, L_0 - L_hdl);

      if (rho > 0) {
        x = x_new;
        valDers = getValDers(x);
        f_x = valDers.vals;
        J_x = valDers.jacobian;
        g = m.multiplyMatrixVector(m.transposeMatrix(J_x), f_x);
        found = normInf(f_x) <= epsilon3 || normInf(g) <= epsilon1;
      }

      if (rho > 0.75) {
        delta = Math.max(delta, 3 * m.norm(hdl));
      } else if (rho < 0.25) {
        delta = delta / 2;
        found = found || delta <= epsilon2 * (m.norm(x) + epsilon2);
      }
    }
  }

  return x;
}

function solveNormalEquations(J, f) {
  const JT = m.transposeMatrix(J);
  const H = m.multiplyMatrices(JT, J);
  const g = m.multiplyMatrixVector(JT, f);

  // Regularization: Add a small value to the diagonal of H
  for (let i = 0; i < H.length; i++) {
    H[i][i] += 1e-8;
  }

  const term2 = m.transposeMatrix([m.scaleVector(g, -1)]);

  return lusolve(H, term2);
}

function computeHdl(hsd, hgn, alpha, delta) {
  let a = m.scaleVector(hsd, alpha);
  let b = hgn;

  if (m.norm(hgn) <= delta) {
    return hgn;
  } else if (m.norm(a) >= delta) {
    return m.scaleVector(hsd, safeDivide(delta, m.norm(hsd)));
  } else {
    let a = hsd;
    let b = hgn;
    let c = m.dotProduct(b, m.subtractVectors(b, a));
    let betaTerm = Math.sqrt(
      c ** 2 + m.norm2(m.subtractVectors(b, a)) * (delta ** 2 - m.norm2(a)),
    );
    let beta =
      c <= 0
        ? safeDivide(-c + betaTerm, m.norm2(m.subtractVectors(b, a)))
        : safeDivide(delta ** 2 - m.norm2(a), c + betaTerm);
    return m.addVectors(a, m.scaleVector(m.subtractVectors(b, a), beta));
  }
}

function computeL(f_x, J_x, h) {
  return 0.5 * m.norm2(m.addVectors(f_x, m.multiplyMatrixVector(J_x, h)));
}

function normInf(vector) {
  return Math.max(...vector.map(Math.abs));
}

function safeDivide(x0, x1) {
  if (x1 === 0) {
    console.log("dividing by zero");
    x1 += 1e-15;
  }
  return x0 / x1;
}
