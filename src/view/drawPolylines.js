import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawPolylines(state, outputGeometry) {
  if (outputGeometry.length === 0) return "";

  const pathData = outputGeometry.polylines
    .map((polyline) => {
      if (!polyline || polyline.length === 0) return "";
      return `M ${polyline[0][0]} ${polyline[0][1]} ${polyline
        .slice(1)
        .map((point) => `L ${point[0]} ${point[1]}`)
        .join(" ")}`;
    })
    .join(" ");

  return svg`
    <path
      d=${pathData}
      fill-rule=${outputGeometry.attributes?.fillRule || "evenodd"}
      fill=${outputGeometry.attributes?.fill || "none"}
      stroke=${outputGeometry.attributes?.stroke || "black"}
      stroke-width=${outputGeometry.attributes?.strokeWidth || PT_SIZE * 0.6}
      stroke-linecap=${outputGeometry.attributes?.strokeLinecap || "butt"}
      stroke-dasharray=${
        outputGeometry.attributes?.strokeDashLength
          ? `${
              outputGeometry.attributes?.strokeDashLength *
              state.panZoomMethods.scale()
            } ${
              outputGeometry.attributes?.strokeDashLength *
              state.panZoomMethods.scale()
            }`
          : "none"
      }
      vector-effect="non-scaling-stroke"
    />
  `;
}
