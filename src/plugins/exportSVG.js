import { createRandStr } from "../utils/createRandStr.js";

const type = "exportSVG";
const name = "Export SVG";

export const exportSVG = {
  type,
  name,
  applyOnce: true,
  init(options = {}) {
    return {
      id: createRandStr(),
      name,
      type,
      controls: [
        {
          id: "strokeWidth",
          type: "number",
          value: options.strokeWidth || 0.5,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: "Stroke Width (mm)",
        },
        {
          id: "strokeColor",
          type: "color",
          value: options.strokeColor || "#FF0000",
          label: "Stroke Color",
        },
        {
          id: "includeViewbox",
          type: "toggle",
          value: options.includeViewbox !== undefined ? options.includeViewbox : true,
          label: "Include Viewbox",
        },
        {
          id: "fileName",
          type: "string",
          value: options.fileName || "outlet-export",
          label: "File Name",
        },
      ],
    };
  },
  process(controls, inputGeometry) {
    // Calculate bounds of the content to determine viewBox
    const getBounds = (geometry) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      geometry.forEach((path) => {
        path.polylines.forEach((polyline) => {
          polyline.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });
        });
      });

      // Add padding
      const padding = 10;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + (padding * 2),
        height: maxY - minY + (padding * 2),
      };
    };

    // Generate SVG content
    const createSVG = (geometry, svgOptions) => {
      const { strokeWidth, strokeColor, includeViewbox } = svgOptions;
      const precision = 2; 
      
      // Calculate document bounds
      const bounds = getBounds(geometry);
      
      // Start SVG document
      let svgContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
      svgContent += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
      
      // Set up SVG tag with appropriate attributes
      svgContent += '<svg xmlns="http://www.w3.org/2000/svg" ';
      svgContent += 'xmlns:xlink="http://www.w3.org/1999/xlink" ';
      
      if (includeViewbox) {
        svgContent += `viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" `;
        svgContent += `width="${bounds.width}mm" height="${bounds.height}mm" `;
      }
      
      svgContent += 'version="1.1">\n';
      
      // Add metadata
      svgContent += '  <metadata>\n';
      svgContent += '    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n';
      svgContent += '      <rdf:Description>\n';
      svgContent += '        <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Outlet Export</dc:title>\n';
      svgContent += '        <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">Outlet Vector Editor</dc:creator>\n';
      svgContent += '      </rdf:Description>\n';
      svgContent += '    </rdf:RDF>\n';
      svgContent += '  </metadata>\n';
      
      // Process each path
      geometry.forEach((path, index) => {
        path.polylines.forEach((polyline, polyIndex) => {
          if (polyline.length < 2) return; // Skip paths with less than 2 points
          
          svgContent += `  <path id="path${index}_${polyIndex}" `;
          
          // Generate d attribute (path data)
          svgContent += 'd="';
          polyline.forEach(([x, y], i) => {
            const formattedX = x.toFixed(precision);
            const formattedY = y.toFixed(precision);
            
            if (i === 0) {
              svgContent += `M ${formattedX} ${formattedY} `;
            } else {
              svgContent += `L ${formattedX} ${formattedY} `;
            }
          });
          
          // Close path if it's a closed shape
          if (path.attributes && path.attributes.closed) {
            svgContent += 'Z';
          }
          svgContent += '" ';
          
          // Add style attributes
          const pathFill = (path.attributes && path.attributes.fill) || "none"; // Default to none for laser cutting
          const pathStroke = (path.attributes && path.attributes.stroke) || strokeColor;
          const pathStrokeWidth = (path.attributes && path.attributes.strokeWidth) || strokeWidth;
          
          svgContent += `fill="${pathFill}" `;
          svgContent += `stroke="${pathStroke}" `;
          svgContent += `stroke-width="${pathStrokeWidth}" `;
          
          // Close path tag
          svgContent += '/>\n';
        });
      });
      
      // Close SVG tag
      svgContent += '</svg>';
      
      return svgContent;
    };

    // Get SVG options from controls
    const svgOptions = {
      strokeWidth: controls.strokeWidth,
      strokeColor: controls.strokeColor,
      includeViewbox: controls.includeViewbox
    };
    
    // Generate SVG content
    const svgContent = createSVG(inputGeometry, svgOptions);
    
    // Create a download link
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${controls.fileName || 'outlet-export'}.svg`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    // Return input geometry unchanged
    return inputGeometry;
  },
}; 