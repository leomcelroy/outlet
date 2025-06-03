import { mergePolylines } from "./mergePolylines.js";
import { threshold } from "./threshold.js";
import { distanceTransform } from "./distanceTransform.js";
import { marchingSquares } from "./marchingSquares.js";

/**
 * Vectorize an image using threshold, distance transform, and marching squares
 * @param {string} base64Image - Base64 encoded image data
 * @returns {Promise<Array<Array<{x: number, y: number}>>>} Array of polylines
 */
export async function vectorizeImg(base64Image) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const polylines = processImage(img);
        console.log({ polylines });
        resolve(polylines);
      } catch (error) {
        console.error("Error in processImage:", error);
        reject(error);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64Image;
  });
}

function processImage(img) {
  // Create canvas for image processing
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas size (scale down large images for performance)
  const maxSize = 2000;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);

  // Draw and process image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Invert the image
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
    data[i + 3] = 255; // Keep alpha at 255 (opaque)
  }

  // Apply threshold
  const thresholdedImg = threshold({
    img: {
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
    },
    threshold: 0.5,
  });

  // Apply distance transform
  const distanceField = distanceTransform(thresholdedImg);

  // Apply marching squares to the distance field
  const polylines = marchingSquares(distanceField, 0.5);

  console.log({ polylines });

  return polylines;
}
