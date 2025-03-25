// Leo McElroy (c) 2024

import { lusolve } from "./lusolve.js";
import * as m from "./matrix.js";

const EPSILON = 1e-8;

const totalError = (residuals) =>
  residuals.reduce((acc, cur) => acc + cur ** 2, 0);

export function levenbergMarquardt(
  getValDers,
  variableValues,
  {
    ogLambda = 10,
    lambdaUp = 10,
    lambdaDown = 10,
    epsilon = EPSILON,
    fast = true,
    maxSteps = Infinity,
  } = {},
) {
  let lambda = ogLambda;
  let updateJacobian = true;
  let converged = false;

  let transJacobian,
    hessianApprox,
    residuals,
    jacobian,
    weighted,
    gradient,
    newValDers,
    costGradient,
    a,
    b,
    deltas,
    error,
    newVariableValues,
    newError;

  let valDers = getValDers(variableValues);

  if (valDers.vals.length === 0) return variableValues;

  let steps = 0;
  while (!converged && steps < maxSteps) {
    if (updateJacobian) {
      residuals = valDers.vals;
      jacobian = valDers.jacobian;

      transJacobian = m.transposeMatrix(jacobian);
      hessianApprox = m.multiplyMatrices(transJacobian, jacobian);
      updateJacobian = false;
    }

    weighted = m.scaleMatrix(m.identityMatrix(hessianApprox.length), lambda);
    gradient = m.addMatrices(hessianApprox, weighted);
    costGradient = m.multiplyMatrixVector(transJacobian, residuals);

    a = gradient;
    b = costGradient;

    deltas = lusolve(a, b, fast);

    if (isNaN(deltas[0])) {
      console.log("big errors!");
      // console.log(
      //   JSON.stringify(
      //     {
      //       a,
      //       b,
      //       residuals,
      //       jacobian,
      //       weighted,
      //       gradient,
      //       costGradient,
      //       deltas,
      //     },
      //     null,
      //     2,
      //   ),
      // );
      return;
    }

    error = totalError(valDers.vals);

    newVariableValues = m.subtractVectors(variableValues, deltas);

    newValDers = getValDers(newVariableValues);

    newError = totalError(newValDers.vals);

    converged =
      newError < epsilon ||
      newValDers.jacobian.every((row) =>
        row.every((der) => Math.abs(der) < epsilon),
      ) ||
      Math.abs(error - newError) < epsilon;

    if (newError < error) {
      lambda = lambda / lambdaDown;
      variableValues = newVariableValues;
      valDers = newValDers;
      updateJacobian = true;
    } else {
      lambda = lambda * lambdaUp;
    }

    steps++;
  }

  if (steps > maxSteps) {
    console.log("Took too many steps.");
  }

  return newVariableValues;
}
