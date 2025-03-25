// Leo McElroy (c) 2024

export function norm(vector) {
  return Math.sqrt(dotProduct(vector, vector));
}

export function norm2(vector) {
  return dotProduct(vector, vector);
}

export function multiplyMatrixScalar(matrix, scalar) {
  const numRows = matrix.length;
  const numCols = matrix[0].length;
  const result = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    result[i] = new Array(numCols);
    for (let j = 0; j < numCols; j++) {
      result[i][j] = matrix[i][j] * scalar;
    }
  }
  return result;
}

export function transposeMatrix(m) {
  const numRows = m.length;
  const numCols = m[0].length;
  const result = new Array(numCols);
  for (let i = 0; i < numCols; i++) {
    result[i] = new Array(numRows);
    for (let j = 0; j < numRows; j++) {
      result[i][j] = m[j][i];
    }
  }
  return result;
}

export function dotProduct(a, b) {
  let sum = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function addVectors(a, b) {
  const len = a.length;
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}

export function subtractVectors(a, b) {
  const len = a.length;
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = a[i] - b[i];
  }
  return result;
}

export function scaleVector(v, scalar) {
  const len = v.length;
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = v[i] * scalar;
  }
  return result;
}

export function identityMatrix(n) {
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = 1;
    result[i] = row;
  }
  return result;
}

export function multiplyMatrixVector(m, v) {
  const numRows = m.length;
  const result = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    result[i] = dotProduct(m[i], v);
  }
  return result;
}

export function outerProduct(a, b) {
  const lenA = a.length;
  const lenB = b.length;
  const result = new Array(lenA);
  for (let i = 0; i < lenA; i++) {
    const row = new Array(lenB);
    for (let j = 0; j < lenB; j++) {
      row[j] = a[i] * b[j];
    }
    result[i] = row;
  }
  return result;
}

export function scaleMatrix(m, scalar) {
  return multiplyMatrixScalar(m, scalar); // Reuse the optimized multiplyMatrixScalar
}

export function addMatrices(a, b) {
  const numRows = a.length;
  const numCols = a[0].length;
  const result = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    result[i] = new Array(numCols);
    for (let j = 0; j < numCols; j++) {
      result[i][j] = a[i][j] + b[i][j];
    }
  }
  return result;
}

export function subtractMatrices(a, b) {
  const numRows = a.length;
  const numCols = a[0].length;
  const result = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    result[i] = new Array(numCols);
    for (let j = 0; j < numCols; j++) {
      result[i][j] = a[i][j] - b[i][j];
    }
  }
  return result;
}

export function multiplyMatrices(a, b) {
  const numRowsA = a.length;
  const numColsA = a[0].length;
  const numColsB = b[0].length;
  const result = new Array(numRowsA);

  for (let i = 0; i < numRowsA; i++) {
    result[i] = new Array(numColsB);
    for (let j = 0; j < numColsB; j++) {
      let sum = 0;
      for (let k = 0; k < numColsA; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}
