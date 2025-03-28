import { svg } from "lit-html";

export function drawGrid(x, y, scale, corners, gridSize) {
  return svg`
      <defs>
        <pattern
          id="grid"
          x="${x}"
          y="${y}"
          width="${scale * gridSize}"
          height="${scale * gridSize}"
          patternUnits="userSpaceOnUse">
          <line stroke="black" stroke-width=".2" x1="0" y1="0" x2="${
            scale * gridSize
          }" y2="0"></line>
          <line stroke="black" stroke-width=".2" x1="0" y1="0" x2="0" y2="${
            scale * gridSize
          }"></line>
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#grid)">
      </rect>
      <line 
        stroke="black" 
        stroke-width=".6" 
        x1=${scale * corners.lt[0] + x} 
        y1=${y} 
        x2=${scale * corners.rt[0] + x} 
        y2=${y}>
        </line>
      <line 
        stroke="black" 
        stroke-width=".6" 
        x1=${x} 
        y1=${scale * corners.lb[1] + y} 
        x2=${x} 
        y2=${scale * corners.lt[1] + y}>
        </line>
    `;
}
