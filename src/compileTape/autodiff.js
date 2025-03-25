// Leo McElroy (c) 2024

export function valder(val, der) {
  return [val, der];
}

const zeroSafeDivide = (x0, x1) => {
  if (x1 === 0) x1 += 1e-15;
  return x0 / x1;
};

export const sin = (x) => {
  if (typeof x === "number") {
    return Math.sin(x);
  }
  const sinVal = Math.sin(x[0]);
  const cosVal = Math.cos(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = x[1][i] * cosVal;
  }
  return [sinVal, der];
};

export const cos = (x) => {
  if (typeof x === "number") {
    return Math.cos(x);
  }
  const cosVal = Math.cos(x[0]);
  const sinVal = Math.sin(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = -x[1][i] * sinVal;
  }
  return [cosVal, der];
};

export const tan = (x) => {
  if (typeof x === "number") {
    return Math.tan(x);
  }
  const cosVal = Math.cos(x[0]);
  const cosSquared = cosVal * cosVal;
  const tanVal = Math.tan(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(x[1][i], cosSquared);
  }
  return [tanVal, der];
};

export const asin = (x) => {
  if (typeof x === "number") {
    return Math.asin(x);
  }
  const sqrtVal = Math.sqrt(1 - x[0] * x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(x[1][i], sqrtVal);
  }
  return [Math.asin(x[0]), der];
};

export const acos = (x) => {
  if (typeof x === "number") {
    return Math.acos(x);
  }
  const sqrtVal = Math.sqrt(1 - x[0] * x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(-x[1][i], sqrtVal);
  }
  return [Math.acos(x[0]), der];
};

export const atan = (x) => {
  if (typeof x === "number") {
    return Math.atan(x);
  }
  const denominator = 1 + x[0] * x[0];
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(x[1][i], denominator);
  }
  return [Math.atan(x[0]), der];
};

export const mul = (x0, x1) => {
  if (typeof x0 === "number" && typeof x1 === "number") {
    return x0 * x1;
  }

  if (typeof x0 === "number") {
    const val = x0 * x1[0];
    const der = new Array(x1[1].length);
    for (let i = 0; i < x1[1].length; i++) {
      der[i] = x0 * x1[1][i];
    }
    return [val, der];
  }

  if (typeof x1 === "number") {
    const val = x1 * x0[0];
    const der = new Array(x0[1].length);
    for (let i = 0; i < x0[1].length; i++) {
      der[i] = x1 * x0[1][i];
    }
    return [val, der];
  }

  const val = x0[0] * x1[0];
  const der = new Array(x0[1].length);
  for (let i = 0; i < x0[1].length; i++) {
    der[i] = x0[1][i] * x1[0] + x1[1][i] * x0[0];
  }
  return [val, der];
};

export const div = (x0, x1) => {
  if (typeof x0 === "number" && typeof x1 === "number") {
    zeroSafeDivide(x0, x1);
  }

  if (typeof x0 === "number") {
    const invX1Val = zeroSafeDivide(1, x1[0]);
    const val = x0 * invX1Val;
    const der = new Array(x1[1].length);
    for (let i = 0; i < x1[1].length; i++) {
      der[i] = -x0 * x1[1][i] * invX1Val * invX1Val;
    }
    return [val, der];
  }

  if (typeof x1 === "number") {
    const invX1 = zeroSafeDivide(1, x1);
    const val = x0[0] * invX1;
    const der = new Array(x0[1].length);
    for (let i = 0; i < x0[1].length; i++) {
      der[i] = x0[1][i] * invX1;
    }
    return [val, der];
  }

  const invX1Val = zeroSafeDivide(1, x1[0]);
  const val = x0[0] * invX1Val;
  const der = new Array(x0[1].length);
  for (let i = 0; i < x0[1].length; i++) {
    der[i] = (x0[1][i] * x1[0] - x0[0] * x1[1][i]) * invX1Val * invX1Val;
  }
  return [val, der];
};

export const neg = (x) => {
  if (typeof x === "number") {
    return -x;
  }
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = -x[1][i];
  }
  return [-x[0], der];
};

export const plus = (x0, x1) => {
  if (typeof x0 === "number" && typeof x1 === "number") {
    return x0 + x1;
  }

  if (typeof x0 === "number") {
    const val = x0 + x1[0];
    const der = x1[1].slice();

    return [val, der];
  }

  if (typeof x1 === "number") {
    const val = x0[0] + x1;
    const der = x0[1].slice();

    return [val, der];
  }

  const val = x0[0] + x1[0];
  const der = new Array(x0[1].length);
  for (let i = 0; i < x0[1].length; i++) {
    der[i] = x0[1][i] + x1[1][i];
  }

  return [val, der];
};

export const minus = (x0, x1) => {
  if (typeof x0 === "number" && typeof x1 === "number") {
    return x0 - x1;
  }

  if (typeof x0 === "number") {
    const val = x0 - x1[0];
    const der = new Array(x1[1].length);
    for (let i = 0; i < x1[1].length; i++) {
      der[i] = -x1[1][i];
    }

    return [val, der];
  }

  if (typeof x1 === "number") {
    const val = x0[0] - x1;
    const der = x0[1].slice();

    return [val, der];
  }

  const val = x0[0] - x1[0];
  const der = new Array(x0[1].length);
  for (let i = 0; i < x0[1].length; i++) {
    der[i] = x0[1][i] - x1[1][i];
  }

  return [val, der];
};

export const exp = (x) => {
  if (typeof x === "number") {
    return Math.exp(x);
  }
  const expVal = Math.exp(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = x[1][i] * expVal;
  }

  return [expVal, der];
};

export const sqrt = (x) => {
  if (typeof x === "number") {
    return Math.sqrt(x);
  }
  const sqrtVal = Math.sqrt(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(0.5 * x[1][i], sqrtVal);
  }
  return [sqrtVal, der];
};

export const log = (x) => {
  if (typeof x === "number") {
    return Math.log(x);
  }
  const logVal = Math.log(x[0]);
  const der = new Array(x[1].length);
  for (let i = 0; i < x[1].length; i++) {
    der[i] = zeroSafeDivide(x[1][i], x[0]);
  }
  return [logVal, der];
};

export const power = (x0, x1) => {
  if (typeof x0 === "number" && typeof x1 === "number") {
    return x0 ** x1;
  }

  if (typeof x0 === "number") {
    const powVal = x0 ** x1[0];
    const logX0 = Math.log(x0);
    const der = new Array(x1[1].length);
    for (let i = 0; i < x1[1].length; i++) {
      der[i] = x1[1][i] * powVal * logX0;
    }

    return [powVal, der];
  }

  if (typeof x1 === "number") {
    const powVal = x0[0] ** x1;
    const der = new Array(x0[1].length);
    for (let i = 0; i < x0[1].length; i++) {
      der[i] = zeroSafeDivide(x1 * powVal * x0[1][i], x0[0]);
    }

    return [powVal, der];
  }

  const powVal = x0[0] ** x1[0];
  const logX0 = Math.log(x0[0]);
  const der = new Array(x0[1].length);
  for (let i = 0; i < x0[1].length; i++) {
    der[i] = zeroSafeDivide(
      x1[0] * powVal * x0[1][i],
      x0[0] + logX0 * powVal * x1[1][i],
    );
  }

  return [powVal, der];
};

export const squared = (x) => power(x, 2);

export const smoothMax = (x0, x1, tau = 1) => {
  // Extract values and derivative vectors
  const isNum0 = typeof x0 === "number";
  const isNum1 = typeof x1 === "number";
  const v0 = isNum0 ? x0 : x0[0];
  const v1 = isNum1 ? x1 : x1[0];

  const exp0 = Math.exp(v0 / tau);
  const exp1 = Math.exp(v1 / tau);
  const sumExp = exp0 + exp1;
  const smoothVal = tau * Math.log(sumExp);

  // Derivative weights
  const weight0 = exp0 / sumExp;
  const weight1 = exp1 / sumExp;

  let der = [];
  if (!isNum0 || !isNum1) {
    // Assume derivative vectors have the same length
    const len = !isNum0 ? x0[1].length : x1[1].length;
    for (let i = 0; i < len; i++) {
      const d0 = isNum0 ? 0 : x0[1][i];
      const d1 = isNum1 ? 0 : x1[1][i];
      der[i] = weight0 * d0 + weight1 * d1;
    }
  }
  return [smoothVal, der];
};

export const smoothMin = (x0, x1, tau = 1) => {
  const isNum0 = typeof x0 === "number";
  const isNum1 = typeof x1 === "number";
  const v0 = isNum0 ? x0 : x0[0];
  const v1 = isNum1 ? x1 : x1[0];

  const exp0 = Math.exp(-v0 / tau);
  const exp1 = Math.exp(-v1 / tau);
  const sumExp = exp0 + exp1;
  const smoothVal = -tau * Math.log(sumExp);

  const weight0 = exp0 / sumExp;
  const weight1 = exp1 / sumExp;

  let der = [];
  if (!isNum0 || !isNum1) {
    const len = !isNum0 ? x0[1].length : x1[1].length;
    for (let i = 0; i < len; i++) {
      const d0 = isNum0 ? 0 : x0[1][i];
      const d1 = isNum1 ? 0 : x1[1][i];
      der[i] = weight0 * d0 + weight1 * d1;
    }
  }
  return [smoothVal, der];
};
