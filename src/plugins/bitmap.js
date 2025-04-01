import { createRandStr } from "../utils/createRandStr.js";

const type = "bitmap";
const name = "Bitmap";

const testBitmap = {
  width: 5,
  height: 5,
  data: [
    [1, 1, 1, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 1],
    [0, 0, 0, 0, 1],
  ].flat(),
};

export const bitmap = {
  type,
  name,
  customModal: ({ container, updateControl, close }) => {
    container.innerHTML = `
      <div class="w-20 bg-gray-200 p-2 mb-10">
        <div>Edit bitmap</div>
        <button class="bg-gray-300 border border-gray-400 rounded-md px-2 py-1">
          Close
        </button>
      </div>
    `;

    container.querySelector("button").addEventListener("click", () => {
      close();
    });
  },
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type,
      controls: [
        {
          id: "color",
          type: "color",
          value: options.color || "black",
        },
        {
          id: "bitmap",
          type: "image",
          value: options.bitmap || "none",
        },
      ],
    };
  },
  process(controls, children) {
    // const { bitmap } = controls;

    const bitmap = testBitmap;
    const outlines = boundaries(bitmap);

    return outlines.map((outline) => ({
      type: "path",
      attributes: {
        fill: "none",
        stroke: "deeppink",
      },
      data: [
        { cmd: "start", x: outline[0].x, y: outline[0].y },
        ...outline.slice(1).map(({ x, y }) => ({ cmd: "line", x, y })),
        { cmd: "close" },
      ],
    }));
  },
};

function pointsEqual(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

function boundaries({ data, width, height }) {
  // Total: width * (height+1) horizontal edges + height * (width+1) vertical edges
  const edges = new Array(width * (height + 1) + height * (width + 1)).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[x + y * width] === 1) {
        edges[y * width + x]++;
        edges[(y + 1) * width + x]++;
        edges[width * (height + 1) + (y * (width + 1) + x)]++;
        edges[width * (height + 1) + (y * (width + 1) + x + 1)]++;
      }
    }
  }

  // Find edges with count == 1 (boundary edges)
  const boundaryEdges = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] === 1) {
      boundaryEdges.push(i);
    }
  }

  // Convert boundary edges to line segments with start and end points
  const segments = boundaryEdges.map((index) => {
    if (index < width * (height + 1)) {
      // Horizontal edge
      const y = Math.floor(index / width);
      const x = index % width;
      return {
        start: { x, y },
        end: { x: x + 1, y },
      };
    } else {
      // Vertical edge
      const adjustedIndex = index - width * (height + 1);
      const y = Math.floor(adjustedIndex / (width + 1));
      const x = adjustedIndex % (width + 1);
      return {
        start: { x, y },
        end: { x, y: y + 1 },
      };
    }
  });

  // Merge segments into connected outlines
  const outlines = [];
  let remainingSegments = [...segments];

  while (remainingSegments.length > 0) {
    // Start a new outline
    const firstSegment = remainingSegments[0];
    const outline = [firstSegment.start, firstSegment.end];
    remainingSegments.splice(0, 1);

    let foundConnection = true;
    while (foundConnection && remainingSegments.length > 0) {
      foundConnection = false;
      const currentEndpoint = outline[outline.length - 1];

      // Try to find a segment that connects to the current endpoint
      for (let i = 0; i < remainingSegments.length; i++) {
        const segment = remainingSegments[i];

        // Check if segment.start connects to our current endpoint
        if (pointsEqual(segment.start, currentEndpoint)) {
          outline.push(segment.end);
          remainingSegments.splice(i, 1);
          foundConnection = true;
          break;
        }

        // Check if segment.end connects to our current endpoint
        if (pointsEqual(segment.end, currentEndpoint)) {
          outline.push(segment.start);
          remainingSegments.splice(i, 1);
          foundConnection = true;
          break;
        }
      }
    }

    // Only add valid outlines (at least 3 points to form a closed shape)
    if (outline.length >= 3) {
      outlines.push(outline);
    }
  }

  return outlines;
}
