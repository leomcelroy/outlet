import { createListener } from "../utils/createListener.js";

export function addPanZoom(el) {
  let cancelPanZoomState = false;
  const cancelPanZoom = (bool) => {
    cancelPanZoomState = bool;
  };
  const listen = createListener(el);
  const transformGroups = el.querySelectorAll("[transform-group]");

  const getXY = (e) => {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top; //y position within the element.

    return [x, y];
  };

  let mousedown = false;

  let scale = 1;
  let pointX = 0;
  let pointY = 0;
  let start = { x: 0, y: 0 };

  function setTransform(els) {
    els.forEach((el) => {
      el.style.transformOrigin = `${0}px ${0}px`;
      el.style.transform =
        "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
    });
  }

  function getPoint(x, y) {
    let newX = (x - pointX) / scale;
    let newY = (y - pointY) / scale;

    return [newX, newY];
  }

  listen("mousedown", "", (e) => {
    // if (state.tool !== "SELECT") return;
    if (cancelPanZoomState) return;
    if (e.shiftKey) return;

    const [x, y] = getXY(e);

    mousedown = true;

    start = { x: x - pointX, y: y - pointY };

    if (e.detail === 2) {
      // console.log(x, y, getPoint(x, y));
    }
  });

  listen("mousemove", "", (e) => {
    if (cancelPanZoomState || !mousedown) return;

    const [x, y] = getXY(e);

    pointX = x - start.x;
    pointY = y - start.y;

    setTransform(transformGroups);
  });

  listen("mouseup", "", (evt) => {
    mousedown = false;
  });

  listen("mouseout", "", (evt) => {
    if (el.contains(evt.relatedTarget)) {
      return;
    }

    mousedown = false;
  });

  listen("wheel", "", (e) => {
    // if (cancelPanZoomState) return;
    const [x, y] = getXY(e);

    let xs = (x - pointX) / scale;
    let ys = (y - pointY) / scale;

    if (Math.sign(e.deltaY) < 0) scale *= 1.03;
    else scale /= 1.03;

    pointX = x - xs * scale;
    pointY = y - ys * scale;

    setTransform(transformGroups);

    e.preventDefault();
  });

  function setScaleXY(limits) {
    const bb = el.getBoundingClientRect();
    const xr = limits.x[1] - limits.x[0];
    const yr = limits.y[1] - limits.y[0];
    const xScalingFactor = bb.width / xr;
    const yScalingFactor = bb.height / yr;

    const scalingFactor = Math.min(xScalingFactor, yScalingFactor) * 0.9;

    scale = scalingFactor;

    const center = {
      x: ((limits.x[0] + limits.x[1]) / 2) * scalingFactor - bb.width / 2,
      y: ((limits.y[0] + limits.y[1]) / 2) * scalingFactor - bb.height / 2,
    };

    pointX = -center.x;
    pointY = -center.y;

    setTransform(transformGroups);
  }

  function corners() {
    if (el === null) return null;
    const { left, right, bottom, top, width, height } =
      el.getBoundingClientRect();
    // need rt, lt, rb, lb
    const rt = getPoint(width, height);
    // rt.y = -rt.y
    const lt = getPoint(0, height);
    // lt.y = -lt.y
    const rb = getPoint(width, 0);
    // rb.y = -rb.y
    const lb = getPoint(0, 0);
    // lb.y = -lb.y

    return { rt, lt, rb, lb };
  }

  const panZoomMethods = {
    scale: () => scale,
    x: () => pointX,
    y: () => pointY,
    corners,
    getPoint,
    setScaleXY,
    cancelPanZoom,
  };

  el.panZoomMethods = panZoomMethods;
  el.transformPoint = ([x, y]) => getPoint(x, y);

  return panZoomMethods;
}
