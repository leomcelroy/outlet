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
    const regions = findConnectedRegions(bitmap);
    const boundaries = regions.map((region) =>
      outlineRegion(region[0], bitmap)
    );

    console.log(boundaries);

    return children.flat().map((path) => ({
      ...path,
      attributes: {
        ...path.attributes,
        fill: color,
      },
    }));
  },
};

function outlineRegion(startCell, bitmap) {
  const boundaryPoints = new Set(); // Use a Set to prevent duplicate points
  const width = bitmap.width;
  const height = bitmap.height;
  const data = bitmap.data;

  // Convert startCell [x, y] to string for Set storage
  const pointToString = ([x, y]) => `${x},${y}`;
  const stringToPoint = (str) => str.split(",").map(Number);

  // Add the starting point to boundary
  boundaryPoints.add(pointToString(startCell));

  // Helper functions for direction changes
  const goLeft = ([dx, dy]) => [dy, -dx];
  const goRight = ([dx, dy]) => [-dy, dx];

  // Initial direction (going from left to right)
  let nextStep = [1, 0];

  // Calculate next position
  let next = [startCell[0] + nextStep[0], startCell[1] + nextStep[1]];

  while (true) {
    // Check if we're back at the start
    if (next[0] === startCell[0] && next[1] === startCell[1]) {
      break;
    }

    // Check if next point is outside the bitmap or is a 0 (black cell)
    const isOutsideBounds =
      next[0] < 0 || next[0] >= width || next[1] < 0 || next[1] >= height;
    const isBlackCell =
      isOutsideBounds || data[next[0] + next[1] * width] === 0;

    if (isBlackCell) {
      // We found a black cell, go right
      next = [next[0] - nextStep[0], next[1] - nextStep[1]]; // Step back
      nextStep = goRight(nextStep);
      next = [next[0] + nextStep[0], next[1] + nextStep[1]]; // Move in new direction
    } else {
      // We found a white cell (1), add to boundary
      boundaryPoints.add(pointToString(next));
      nextStep = goLeft(nextStep);
      next = [next[0] + nextStep[0], next[1] + nextStep[1]]; // Move in new direction
    }
  }

  // Convert Set back to array of points
  return Array.from(boundaryPoints).map(stringToPoint);
}

function flood(data, width, height, [x, y]) {
  const indexToFill = data[x + y * width];
  if (indexToFill === 0) return [];

  const around = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  const region = [[x, y]];

  for (let done = 0; done < region.length; done++) {
    for (const { dx, dy } of around) {
      const x = region[done][0] + dx;
      const y = region[done][1] + dy;
      if (
        x >= 0 &&
        x < width &&
        y >= 0 &&
        y < height &&
        data[x + y * width] == indexToFill &&
        !region.some((p) => p[0] == x && p[1] == y)
      ) {
        region.push([x, y]);
        data[x + y * width] = 0; // mark as visited
      }
    }
  }

  return region;
}

function findConnectedRegions(bitmap) {
  const regions = [];
  const data = [...bitmap.data];

  for (let y = 0; y < bitmap.height; y++) {
    for (let x = 0; x < bitmap.width; x++) {
      if (data[x + y * bitmap.width] === 1) {
        const region = flood(data, bitmap.width, bitmap.height, [x, y]);
        regions.push(region);
      }
    }
  }

  return regions;
}
