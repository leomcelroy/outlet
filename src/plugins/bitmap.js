import { createRandStr } from "../utils/createRandStr.js";

const type = "bitmap";
const name = "Bitmap";

const testBitmap = {
  width: 16,
  height: 16,
  data: [
    // Row 1
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    // Row 2
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
    // Row 3
    0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    // Row 4
    0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0,
    // Row 5
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    // Row 6
    1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1,
    // Row 7
    1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1,
    // Row 8
    1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1,
    // Row 9
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    // Row 10
    0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0,
    // Row 11
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    // Row 12
    0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
    // Row 13
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    // Row 14
    0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    // Row 15
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    // Row 16
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

export const bitmap = {
  type,
  name,
  customModal: ({ container, updateControl, close, controls }) => {
    container.innerHTML = `
      <div class="bg-gray-200 p-2 mb-10 inline-block shadow-lg rounded-md border border-gray-400">
        <div>Edit bitmap</div>
        <canvas id="bitmap-canvas" class="[image-rendering:pixelated] mt-2 mb-2 border border-black"></canvas>
        <button class="bg-gray-300 border border-gray-400 rounded-md px-2 py-1">
          Close
        </button>
      </div>
    `;

    container.querySelector("button").addEventListener("click", () => {
      close();
    });

    const bitmap = controls.find((c) => c.id === "bitmap").value;

    const canvas = container.querySelector("#bitmap-canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match bitmap dimensions
    const pixelSize = 30; // Size of each pixel in the canvas
    canvas.width = bitmap.width * pixelSize;
    canvas.height = bitmap.height * pixelSize;
    canvas.style.width = `${bitmap.width * pixelSize}px`;
    canvas.style.height = `${bitmap.height * pixelSize}px`;

    // Function to render the current bitmap state
    function renderBitmap() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the bitmap pixels
      for (let y = 0; y < bitmap.height; y++) {
        for (let x = 0; x < bitmap.width; x++) {
          const pixelValue = bitmap.data[x + y * bitmap.width];
          if (pixelValue === 1) {
            ctx.fillStyle = "black";
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          } else {
            ctx.fillStyle = "white";
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    // Initial render
    renderBitmap();

    // Add click event listener to toggle cells
    canvas.addEventListener("click", (event) => {
      // Get click coordinates relative to canvas
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / pixelSize);
      const y = Math.floor((event.clientY - rect.top) / pixelSize);

      // Make sure the coordinates are within bounds
      if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
        // Create a copy of the bitmap data
        const newData = [...bitmap.data];
        // Toggle the cell (0 -> 1, 1 -> 0)
        const index = x + y * bitmap.width;
        newData[index] = bitmap.data[index] === 1 ? 0 : 1;

        // Update the control with the new bitmap data
        updateControl("bitmap", {
          ...bitmap,
          data: newData,
        });

        // Get the updated control value
        const updatedBitmap = controls.find((c) => c.id === "bitmap").value;

        // Update our local reference
        bitmap.data = updatedBitmap.data;

        // Re-render the bitmap
        renderBitmap();
      }
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
          value: testBitmap,
        },
      ],
    };
  },
  process(controls, children) {
    const { bitmap } = controls;

    const outlines = boundaries(bitmap);

    console.log("PROCESS");
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
