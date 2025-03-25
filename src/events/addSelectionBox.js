import { createListener } from "../utils/createListener.js";

export function addSelectionBox(el, state, callback = null) {
  let start = null;
  let end = null;

  state.selectBox = {
    start: [0, 0],
    end: [0, 0],
  };

  const listener = createListener(el);

  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  listener("mousedown", "", (e) => {
    if (!e.shiftKey) return;
    if (state.tool !== "SELECT") return;

    start = getPoint(e);
    end = getPoint(e);
  });

  listener("mousemove", "", (e) => {
    if (!e.shiftKey) {
      start = null;
      end = null;

      state.selectBox = {
        start,
        end,
      };
      return;
    }

    if (start === null) return;

    end = getPoint(e);

    const newStart = [Math.min(start[0], end[0]), Math.min(start[1], end[1])];
    const newEnd = [Math.max(start[0], end[0]), Math.max(start[1], end[1])];

    state.selectBox = {
      start: newStart,
      end: newEnd,
    };
  });

  function contains(x, y) {
    let { start, end } = state.selectBox;
    return (
      (x > start[0] && x < end[0] && y > start[1] && y < end[1]) ||
      (x > start[0] && x < end[0] && y < start[1] && y > end[1]) ||
      (x < start[0] && x > end[0] && y > start[1] && y < end[1]) ||
      (x < start[0] && x > end[0] && y < start[1] && y > end[1])
    );
  }

  listener("mouseup", "", (e) => {
    if (!e.shiftKey) return;

    if (start && end) {
      const dx = start[0] - end[0];
      const dy = start[1] - end[1];
      const moved = Math.hypot(dx, dy) > 10;
      if (callback && moved) {
        callback({ contains, selectBox: state.selectBox });
      }
    }

    start = null;
    end = null;
    state.selectBox = {
      start,
      end,
    };
  });
}
