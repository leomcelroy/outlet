import { createRandStr } from "../utils/createRandStr.js";

const type = "bitmap";
const name = "Bitmap";

const testBitmap = {
  width: 5,
  height: 5,
  data: [
    [1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ].flat(),
};

export const bitmap = {
  type,
  name,
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

    // // If no bitmap provided, return empty
    // if (!bitmap || bitmap === "none") {
    //   return "";
    // }

    const bitmap = testBitmap;
    // Find connected regions using flood fill algorithm
    const regions = findConnectedRegions(bitmap);

    console.log(regions);

    const paths = regions.map((region) => outlineRegion(region, bitmap.width));

    console.log(paths);
    // // Return SVG paths
    // return paths.join(" ");
  },
};

// Find all connected regions in the bitmap
function findConnectedRegions(bitmap) {
  const { width, height, data } = bitmap;
  const visited = new Array(data.length).fill(false);
  const regions = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i] === 1 && !visited[i]) {
      const region = [];
      floodFill(i, region, visited, data, width, height);
      regions.push(region);
    }
  }

  return regions;
}

// Flood fill algorithm to find connected cells
function floodFill(index, region, visited, data, width, height) {
  // If out of bounds, already visited, or cell is 0, return
  if (
    index < 0 ||
    index >= data.length ||
    visited[index] ||
    data[index] === 0
  ) {
    return;
  }

  // Mark as visited and add to region
  visited[index] = true;
  region.push(index);

  const row = Math.floor(index / width);
  const col = index % width;

  // Check adjacent cells (up, right, down, left)
  if (row > 0) floodFill(index - width, region, visited, data, width, height); // up
  if (col < width - 1)
    floodFill(index + 1, region, visited, data, width, height); // right
  if (row < height - 1)
    floodFill(index + width, region, visited, data, width, height); // down
  if (col > 0) floodFill(index - 1, region, visited, data, width, height); // left
}

// Create the outline of a region
function outlineRegion(region, width) {
  // Convert indices to x,y coordinates
  const cells = region.map((index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }));

  // Find the outline of the region
  const outline = traceOutline(cells);

  // Convert outline to SVG path
  return outline;
}

// Trace the outline of a region
function traceOutline(cells) {
  // Create a map for quick lookup
  const cellMap = new Map();
  cells.forEach((cell) => {
    cellMap.set(`${cell.x},${cell.y}`, true);
  });

  // Find the leftmost cell to start tracing
  const startCell = cells.reduce((leftmost, cell) => {
    if (cell.x < leftmost.x || (cell.x === leftmost.x && cell.y < leftmost.y)) {
      return cell;
    }
    return leftmost;
  }, cells[0]);

  const outline = [];
  let current = { x: startCell.x, y: startCell.y };
  let direction = 0; // 0: right, 1: down, 2: left, 3: up

  // Direction vectors (right, down, left, up)
  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];

  do {
    outline.push(current);

    // Try to turn left (counter-clockwise direction)
    let newDirection = (direction + 3) % 4;
    let nextX = current.x + dx[newDirection];
    let nextY = current.y + dy[newDirection];

    // Keep turning right until we find a valid cell
    while (!cellMap.has(`${nextX},${nextY}`)) {
      newDirection = (newDirection + 1) % 4;
      nextX = current.x + dx[newDirection];
      nextY = current.y + dy[newDirection];
    }

    direction = newDirection;
    current = { x: nextX, y: nextY };
  } while (
    current.x !== startCell.x ||
    current.y !== startCell.y ||
    outline.length <= 1
  );

  return outline;
}
