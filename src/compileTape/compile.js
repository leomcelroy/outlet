// Leo McElroy (c) 2024

import {
  valder,
  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  mul,
  div,
  neg,
  plus,
  minus,
  exp,
  sqrt,
  log,
  power,
  smoothMax,
  smoothMin,
} from "./autodiff.js";

export function compile(paramList, expression) {
  const toks = expression.trim().split(/\s+/);

  const tape = compileStack(paramList, toks);

  const fn = (argList, onlyVal = false) => {
    return !onlyVal
      ? evaluateTape(tape, argList)
      : evaluateTapeVal(tape, argList);
  };

  return fn;
}

const builtInFns = {
  sin: 1,
  cos: 1,
  tan: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  exp: 1,
  sqrt: 1,
  log: 1,
  neg: 1,
  max: 2,
  min: 2,
};

function compileStack(paramList, toks) {
  const tape = [];

  toks.forEach((tok) => buildTape(tok));

  function buildTape(str) {
    if (isNumber(str)) {
      tape.push({ type: "pushValue", raw: str, value: parseFloat(str) });
    } else if (isSymbol(str)) {
      let variable = str;
      let index = paramList.indexOf(variable);
      const jacobian = paramList.map((x) => (x === variable ? 1 : 0));
      tape.push({ type: "pushSymbol", raw: str, index, jacobian });
    } else if (isBinary(str)) {
      tape.push({ type: "evaluateBinary", raw: str, operator: str });
    } else if (isCall(str)) {
      tape.push({
        type: "evaluateCall",
        raw: str,
        func: str,
        argCount: builtInFns[str],
      });
    } else {
      throw new Error(`Unsupported node type: ${str}`);
    }
  }

  function isNumber(str) {
    return /^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/.test(str);
  }

  function isSymbol(str) {
    return paramList.includes(str);
  }

  function isBinary(str) {
    return new Set(["+", "-", "*", "/", "^"]).has(str);
  }

  function isCall(str) {
    return str in builtInFns;
  }

  return tape;
}

function evaluateTape(tape, args) {
  const valueStack = [];

  for (const instruction of tape) {
    if (instruction.type === "pushValue") {
      valueStack.push(instruction.value);
    } else if (instruction.type === "pushSymbol") {
      const { index, jacobian } = instruction;
      valueStack.push(valder(args[index], jacobian));
    } else if (instruction.type === "evaluateBinary") {
      const right = valueStack.pop();
      const left = valueStack.pop();
      switch (instruction.operator) {
        case "+":
          valueStack.push(plus(left, right));
          break;
        case "*":
          valueStack.push(mul(left, right));
          break;
        case "/":
          valueStack.push(div(left, right));
          break;
        case "-":
          valueStack.push(minus(left, right));
          break;
        case "^":
          valueStack.push(power(left, right));
          break;
      }
    } else if (instruction.type === "evaluateCall") {
      const newArgs = [];
      for (let i = 0; i < instruction.argCount; i++) {
        newArgs.unshift(valueStack.pop());
      }
      switch (instruction.func) {
        case "sin":
          valueStack.push(sin(...newArgs));
          break;
        case "cos":
          valueStack.push(cos(...newArgs));
          break;
        case "tan":
          valueStack.push(tan(...newArgs));
          break;
        case "asin":
          valueStack.push(asin(...newArgs));
          break;
        case "acos":
          valueStack.push(acos(...newArgs));
          break;
        case "atan":
          valueStack.push(atan(...newArgs));
          break;
        case "exp":
          valueStack.push(exp(...newArgs));
          break;
        case "sqrt":
          valueStack.push(sqrt(...newArgs));
          break;
        case "log":
          valueStack.push(log(...newArgs));
          break;
        case "neg":
          valueStack.push(neg(...newArgs));
          break;
        case "min":
          valueStack.push(smoothMin(...newArgs));
          break;
        case "max":
          valueStack.push(smoothMax(...newArgs));
          break;
      }
    }
  }

  return valueStack.pop();
}

function evaluateTapeVal(tape, args) {
  const valueStack = [];

  for (const instruction of tape) {
    if (instruction.type === "pushValue") {
      valueStack.push(instruction.value);
    } else if (instruction.type === "pushSymbol") {
      const { index, jacobian } = instruction;
      valueStack.push(args[index]);
    } else if (instruction.type === "evaluateBinary") {
      let right = valueStack.pop();
      const left = valueStack.pop();
      switch (instruction.operator) {
        case "+":
          valueStack.push(left + right);
          break;
        case "*":
          valueStack.push(left * right);
          break;
        case "/":
          if (right === 0) right += 1e-10;
          valueStack.push(left / right);
          break;
        case "-":
          valueStack.push(left - right);
          break;
        case "^":
          valueStack.push(left ** right);
          break;
      }
    } else if (instruction.type === "evaluateCall") {
      const newArgs = [];
      for (let i = 0; i < instruction.argCount; i++) {
        newArgs.unshift(valueStack.pop());
      }
      switch (instruction.func) {
        case "sin":
          valueStack.push(Math.sin(...newArgs));
          break;
        case "cos":
          valueStack.push(Math.cos(...newArgs));
          break;
        case "tan":
          valueStack.push(Math.tan(...newArgs));
          break;
        case "asin":
          valueStack.push(Math.asin(...newArgs));
          break;
        case "acos":
          valueStack.push(Math.acos(...newArgs));
          break;
        case "atan":
          valueStack.push(Math.atan(...newArgs));
          break;
        case "exp":
          valueStack.push(Math.exp(...newArgs));
          break;
        case "sqrt":
          valueStack.push(Math.sqrt(...newArgs));
          break;
        case "log":
          valueStack.push(Math.log(...newArgs));
          break;
        case "neg":
          valueStack.push(-newArgs[0]);
          break;
        case "max":
          valueStack.push(Math.max(...newArgs));
          break;
        case "min":
          valueStack.push(Math.min(...newArgs));
          break;
      }
    }
  }

  return valueStack.pop();
}
