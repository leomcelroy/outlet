import { createRandStr } from "../utils/createRandStr.js";
import { html, render, svg } from "lit-html";

const type = "bitmap";
const name = "Bitmap";

const defaultBitmap = {
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
    const bitmapData = controls.find((c) => c.id === "bitmap").value;
    const pixelSize = 30; // Size of each pixel in the canvas

    // State variables
    let isDrawing = false;
    let startPos = [0, 0];
    let lastPos = [0, 0];
    let bitmap = { ...bitmapData };

    // Function to re-render the entire modal
    const renderModal = () => {
      const template = html`
        <div
          class="bg-gray-200 p-2 mb-10 inline-block shadow-lg rounded-md border border-gray-400 mr-4">
          <div
            class="flex justify-between items-center text-gray-800 mb-2 px-2">
            <div class="text-lg font-semibold">Edit Bitmap</div>
            <button
              class="bg-gray-300 border border-gray-400 rounded-md px-2 py-0.5 text-sm"
              @click=${close}>
              Close
            </button>
          </div>
          <div class="relative">
            <canvas
              id="bitmap-canvas"
              width="${bitmap.width * pixelSize}"
              height="${bitmap.height * pixelSize}"
              class="[image-rendering:pixelated] mt-2 mb-2 border border-black"
              style="width: ${bitmap.width *
              pixelSize}px; height: ${bitmap.height * pixelSize}px"
              @mousedown=${handleMouseDown}
              @mousemove=${handleMouseMove}
              @mouseup=${handleMouseUp}
              @mouseleave=${handleMouseLeave}></canvas>
            <svg
              id="bitmap-overlay"
              width="${bitmap.width * pixelSize}"
              height="${bitmap.height * pixelSize}"
              class="absolute top-0 left-0 pointer-events-none"
              style="z-index: 10;">
              <!-- Grid lines -->
              ${renderGridLines(bitmap.width, bitmap.height, pixelSize)}
              <!-- Highlights -->
              <rect
                id="row-highlight"
                fill="rgba(0, 119, 255, 0.05)"
                x="0"
                y="0"
                width="0"
                height="0"></rect>
              <rect
                id="col-highlight"
                fill="rgba(0, 119, 255, 0.05)"
                x="0"
                y="0"
                width="0"
                height="0"></rect>
              <rect
                id="cell-highlight"
                fill="rgba(0, 119, 255, 0.15)"
                stroke="rgba(0, 119, 255, 0.5)"
                stroke-width="1"
                x="0"
                y="0"
                width="${pixelSize}"
                height="${pixelSize}"
                style="display: none"></rect>
            </svg>
          </div>
          <div class="flex items-center mb-2">
            <div class="flex gap-2 items-center">
              <div class="flex items-center">
                <label for="bitmap-width" class="mr-2">Width:</label>
                <input
                  id="bitmap-width"
                  type="number"
                  min="1"
                  max="64"
                  .value="${bitmap.width}"
                  class="w-16 px-1 py-0.5 border border-gray-400 rounded-md text-center" />
              </div>
              <div class="flex items-center">
                <label for="bitmap-height" class="mr-2">Height:</label>
                <input
                  id="bitmap-height"
                  type="number"
                  min="1"
                  max="64"
                  .value="${bitmap.height}"
                  class="w-16 px-1 py-0.5 border border-gray-400 rounded-md text-center" />
              </div>
              <button
                id="resize-bitmap"
                class="bg-blue-300 border border-gray-400 rounded-md px-2 py-1"
                @click=${resizeBitmap}>
                Resize
              </button>
              <button
                id="clear-bitmap"
                class="bg-red-300 border border-gray-400 rounded-md px-2 py-1"
                @click=${clearBitmap}>
                Clear
              </button>
            </div>
            <div
              id="coordinates"
              class="ml-auto font-mono text-sm text-gray-600">
              X: 0, Y: 0
            </div>
          </div>
        </div>
      `;

      render(template, container);

      // After rendering, get the canvas and draw the bitmap
      const canvas = container.querySelector("#bitmap-canvas");
      const ctx = canvas.getContext("2d");
      renderBitmap(ctx);
    };

    // Render bitmap on canvas
    const renderBitmap = (ctx) => {
      if (!ctx) {
        const canvas = container.querySelector("#bitmap-canvas");
        ctx = canvas.getContext("2d");
      }

      // Clear canvas
      ctx.clearRect(0, 0, bitmap.width * pixelSize, bitmap.height * pixelSize);

      // Draw the bitmap pixels
      for (let y = 0; y < bitmap.height; y++) {
        for (let x = 0; x < bitmap.width; x++) {
          const pixelValue = bitmap.data[x + y * bitmap.width];
          ctx.fillStyle = pixelValue === 1 ? "black" : "white";
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    };

    // Utility functions
    const canvasToBitmapCoords = (clientX, clientY) => {
      const canvas = container.querySelector("#bitmap-canvas");
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / pixelSize);
      const y = Math.floor((clientY - rect.top) / pixelSize);
      return [x, y];
    };

    const paletteIndexAt = ([x, y]) => {
      if (x > bitmap.width - 1 || x < 0 || y > bitmap.height - 1 || y < 0) {
        return -1;
      }
      return bitmap.data[x + y * bitmap.width];
    };

    const applyChanges = (changes) => {
      if (!changes || changes.length === 0) return;

      // Create a copy of the bitmap data
      const newData = [...bitmap.data];

      // Apply each change
      changes.forEach(([x, y, value]) => {
        if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
          newData[x + y * bitmap.width] = value;
        }
      });

      // Update the control with the new bitmap data
      updateControl("bitmap", {
        ...bitmap,
        data: newData,
      });

      // Update our local reference
      bitmap = {
        ...bitmap,
        data: newData,
      };

      // Re-render the bitmap
      const canvas = container.querySelector("#bitmap-canvas");
      renderBitmap(canvas.getContext("2d"));
    };

    // Drawing functions
    const brushTool = ([x, y], paletteIndex) => {
      const indexToFill = paletteIndexAt([x, y]);
      if (indexToFill === paletteIndex) return [];
      return [[x, y, paletteIndex]];
    };

    const lineTool = ([x0, y0], [x1, y1], paletteIndex) => {
      const changes = [];
      if (Math.abs(x0 - x1) > Math.abs(y0 - y1)) {
        if (x0 > x1)
          [[x0, y0], [x1, y1]] = [
            [x1, y1],
            [x0, y0],
          ];
        const slope = (y1 - y0) / (x1 - x0);
        for (let [x, y] = [x0, y0]; x <= x1; x++) {
          changes.push([x, Math.round(y), paletteIndex]);
          y += slope;
        }
      } else {
        if (y0 > y1)
          [[x0, y0], [x1, y1]] = [
            [x1, y1],
            [x0, y0],
          ];
        const slope = (x1 - x0) / (y1 - y0);
        for (let [x, y] = [x0, y0]; y <= y1; y++) {
          changes.push([Math.round(x), y, paletteIndex]);
          x += slope;
        }
      }
      return changes;
    };

    const updateHighlights = (x, y) => {
      const overlay = container.querySelector("#bitmap-overlay");
      const rowHighlight = overlay.querySelector("#row-highlight");
      const colHighlight = overlay.querySelector("#col-highlight");
      const cellHighlight = overlay.querySelector("#cell-highlight");
      const coordinatesElement = container.querySelector("#coordinates");

      // Update coordinates display
      if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
        coordinatesElement.textContent = `X: ${x}, Y: ${y}`;
      } else {
        coordinatesElement.textContent = `X: -, Y: -`;
      }

      if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
        // Update row and column highlights
        rowHighlight.setAttribute("x", "0");
        rowHighlight.setAttribute("y", y * pixelSize);
        rowHighlight.setAttribute("width", bitmap.width * pixelSize);
        rowHighlight.setAttribute("height", pixelSize);

        colHighlight.setAttribute("x", x * pixelSize);
        colHighlight.setAttribute("y", "0");
        colHighlight.setAttribute("width", pixelSize);
        colHighlight.setAttribute("height", bitmap.height * pixelSize);

        // Update cell highlight
        cellHighlight.setAttribute("x", x * pixelSize);
        cellHighlight.setAttribute("y", y * pixelSize);

        // Show all highlights
        rowHighlight.style.display = "block";
        colHighlight.style.display = "block";
        cellHighlight.style.display = "block";
      } else {
        rowHighlight.style.display = "none";
        colHighlight.style.display = "none";
      }
    };

    const handleMouseDown = (event) => {
      isDrawing = true;
      startPos = canvasToBitmapCoords(event.clientX, event.clientY);
      lastPos = [...startPos];

      // Apply brush immediately
      const changes = brushTool(startPos, 1);
      applyChanges(changes);
    };

    const handleMouseMove = (event) => {
      const [x, y] = canvasToBitmapCoords(event.clientX, event.clientY);
      updateHighlights(x, y);

      if (!isDrawing) return;

      // For brush, we want to create a smooth line between last position and current
      const changes = lineTool(lastPos, [x, y], 1);
      applyChanges(changes);
      lastPos = [x, y];
    };

    const handleMouseUp = (event) => {
      isDrawing = false;
    };

    const handleMouseLeave = () => {
      isDrawing = false;

      // Hide highlights
      const overlay = container.querySelector("#bitmap-overlay");
      const rowHighlight = overlay.querySelector("#row-highlight");
      const colHighlight = overlay.querySelector("#col-highlight");
      rowHighlight.style.display = "none";
      colHighlight.style.display = "none";

      // Reset coordinates
      const coordinatesElement = container.querySelector("#coordinates");
      coordinatesElement.textContent = `X: -, Y: -`;
    };

    const clearBitmap = () => {
      const newData = Array(bitmap.width * bitmap.height).fill(0);
      updateControl("bitmap", {
        ...bitmap,
        data: newData,
      });
      bitmap = {
        ...bitmap,
        data: newData,
      };
      const canvas = container.querySelector("#bitmap-canvas");
      renderBitmap(canvas.getContext("2d"));
    };

    const resizeBitmap = () => {
      const widthInput = container.querySelector("#bitmap-width");
      const heightInput = container.querySelector("#bitmap-height");
      const newWidth = parseInt(widthInput.value, 10);
      const newHeight = parseInt(heightInput.value, 10);

      if (
        isNaN(newWidth) ||
        isNaN(newHeight) ||
        newWidth < 1 ||
        newHeight < 1 ||
        newWidth > 64 ||
        newHeight > 64
      ) {
        alert("Width and height must be between 1 and 64");
        return;
      }

      const newData = Array(newWidth * newHeight).fill(0);

      for (let y = 0; y < Math.min(bitmap.height, newHeight); y++) {
        for (let x = 0; x < Math.min(bitmap.width, newWidth); x++) {
          const oldIndex = x + y * bitmap.width;
          const newIndex = x + y * newWidth;
          newData[newIndex] = bitmap.data[oldIndex];
        }
      }

      updateControl("bitmap", {
        width: newWidth,
        height: newHeight,
        data: newData,
      });

      bitmap = {
        width: newWidth,
        height: newHeight,
        data: newData,
      };

      renderModal();
    };

    // Function to generate grid lines SVG elements
    const renderGridLines = (width, height, pixelSize) => {
      const lines = [];

      // Vertical grid lines
      for (let x = 1; x < width; x++) {
        lines.push(svg`
          <line
            x1="${x * pixelSize}"
            y1="0"
            x2="${x * pixelSize}"
            y2="${height * pixelSize}"
            stroke="rgba(0, 0, 0, 0.5)"
            stroke-width="1" />
        `);
      }

      // Horizontal grid lines
      for (let y = 1; y < height; y++) {
        lines.push(svg`
          <line
            x1="0"
            y1="${y * pixelSize}"
            x2="${width * pixelSize}"
            y2="${y * pixelSize}"
            stroke="rgba(0, 0, 0, 0.5)"
            stroke-width="1" />
        `);
      }

      return lines;
    };

    // Initialize the modal
    renderModal();
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
          value: defaultBitmap,
        },
      ],
    };
  },
  process(controls, children) {
    const { bitmap } = controls;

    const outlines = boundaries(bitmap);

    if (outlines.length === 0) return [];
    // Create a single path with multiple subpaths
    const pathData = [];

    // Process each outline into a subpath
    outlines.forEach((outline) => {
      // Start a new subpath with a move command
      pathData.push({ cmd: "move", x: outline[0].x, y: outline[0].y });

      // Add line commands for the rest of the points
      outline.slice(1).forEach(({ x, y }) => {
        pathData.push({ cmd: "line", x, y });
      });
    });

    pathData.push({ cmd: "close" });

    // Return a single path object containing all subpaths
    return [
      {
        type: "path",
        attributes: {},
        data: pathData,
      },
    ];
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
