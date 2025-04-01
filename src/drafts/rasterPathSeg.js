import { createRandStr } from "../utils/createRandStr.js";
import { convertPathToPolylines } from "../utils/convertPathToPolylines.js";

const type = "rasterPath";
const name = "Raster Path";

export const rasterPath = {
  type,
  name,
  init() {
    return {
      id: createRandStr(),
      name,
      enabled: true,
      type,
      controls: [
        {
          id: "segmentLength",
          type: "number",
          label: "Segment Length",
          value: 1,
        },
      ],
    };
  },
  process(controls, children) {
    const { segmentLength } = controls;

    if (segmentLength < 0.5) {
      segmentLength = 0.5;
    }

    // Create a map to store paths by ID
    const pathsByID = new Map();

    for (const path of children.flat()) {
      const polylines = convertPathToPolylines(path.data);

      for (const polyline of polylines) {
        const pathData = [];
        let prevPoint = polyline[0];
        // move to start point of the segment
        pathData.push({
          x: prevPoint[0],
          y: prevPoint[1],
          cmd: "move",
        });

        for (let i = 1; i < polyline.length; i += 1) {
          const currentPoint = polyline[i];

          const distance = Math.sqrt(
            (currentPoint[0] - prevPoint[0]) ** 2 +
              (currentPoint[1] - prevPoint[1]) ** 2
          );

          const numSegments = Math.abs(Math.floor(distance / segmentLength));

          // const extra = distance % segmentLength;

          // let actualSegmentLength =
          //   extra > 0 ? segmentLength + extra / segmentLength : segmentLength;

          const segDx = currentPoint[0] - prevPoint[0];
          const segDy = currentPoint[1] - prevPoint[1];

          const stitchDx = segDx / numSegments;
          const stitchDy = segDy / numSegments;

          // Create intermediate segments
          for (let j = 0; j < numSegments; j = j + 1) {
            const { x: lastX, y: lastY } = pathData.at(-1);

            pathData.push({
              x: lastX + stitchDx,
              y: lastY + stitchDy,
              cmd: "line",
            });
          }

          prevPoint = currentPoint;
        }

        // If we already have data for this ID, append to it
        if (pathsByID.has(path.id)) {
          const existingData = pathsByID.get(path.id);
          // Add a move command to start the new segment
          pathData[0].cmd = "move";
          pathsByID.set(path.id, [...existingData, ...pathData]);
        } else {
          pathsByID.set(path.id, pathData);
        }
      }
    }

    // Convert the map back to an array of paths
    return Array.from(pathsByID.entries()).map(([id, data]) => ({
      type: "path",
      id,
      data,
      attributes: {
        strokeDashLength: segmentLength,
      },
    }));
  },
};
