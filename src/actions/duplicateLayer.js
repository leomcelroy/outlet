import { STATE } from "../index.js";
import { createRandStr } from "../utils/createRandStr.js";
import { evaluateAllLayers } from "../utils/evaluateAllLayers.js";

function generateUniqueLayerName(baseName) {
  let name = `${baseName} (Copy)`;
  let counter = 1;

  // Keep trying until we find a unique name
  while (STATE.layers.some((layer) => layer.name === name)) {
    name = `${baseName} (Copy ${counter})`;
    counter++;
  }

  return name;
}

export function duplicateLayer() {
  const activeLayer = STATE.layers.find((l) => l.id === STATE.activeLayer);
  if (!activeLayer) return;

  // Create new layer with unique ID
  const newId = `LAYER_${createRandStr(4)}`;
  const newLayer = {
    id: newId,
    name: generateUniqueLayerName(activeLayer.name),
    parent: activeLayer.parent,
    children: [...activeLayer.children],
    plugins: activeLayer.plugins.map((plugin) => {
      const newPluginId = `PLUGIN_${createRandStr(4)}`;

      // Deep copy controls if they exist
      const newControls = plugin.controls
        ? plugin.controls.map((control) => ({
            ...control,
            id: createRandStr(4),
          }))
        : [];

      return {
        ...plugin,
        id: newPluginId,
        controls: newControls,
      };
    }),
    outputGeometry: [],
    inputGeometry: [],
  };

  // Deep copy all geometries in the layer
  const geometryMap = new Map(); // Maps old geometry IDs to new ones
  const paramMap = new Map(); // Maps old param IDs to new ones

  // First pass: Create new points and params
  STATE.geometries.forEach((geo) => {
    if (geo.layer === activeLayer.id && geo.type === "point") {
      const newXId = createRandStr(4);
      const newYId = createRandStr(4);
      const newPointId = createRandStr(4);

      // Copy param values
      STATE.params[newXId] = STATE.params[geo.x];
      STATE.params[newYId] = STATE.params[geo.y];

      // Create new point
      const newPoint = {
        ...geo,
        id: newPointId,
        x: newXId,
        y: newYId,
        layer: newId,
      };

      geometryMap.set(geo.id, newPointId);
      paramMap.set(geo.x, newXId);
      paramMap.set(geo.y, newYId);

      STATE.geometries.push(newPoint);
    }
  });

  // Second pass: Create new paths and lines
  STATE.geometries.forEach((geo) => {
    if (
      geo.layer === activeLayer.id &&
      (geo.type === "path" || geo.type === "line")
    ) {
      const newGeoId = createRandStr(4);
      const newGeo = { ...geo, id: newGeoId, layer: newId };

      if (geo.type === "path") {
        // Deep copy path data
        newGeo.data = geo.data.map((cmd) => {
          const newCmd = { ...cmd };
          if (cmd.point) newCmd.point = geometryMap.get(cmd.point);
          if (cmd.control1) {
            const newControl1Id = createRandStr(4);
            const newControl1XId = createRandStr(4);
            const newControl1YId = createRandStr(4);

            // Create new control point
            const newControl1 = {
              ...STATE.geometries.find((g) => g.id === cmd.control1),
              id: newControl1Id,
              x: newControl1XId,
              y: newControl1YId,
              layer: newId,
            };

            // Copy control point param values
            STATE.params[newControl1XId] = STATE.params[newControl1.x];
            STATE.params[newControl1YId] = STATE.params[newControl1.y];

            STATE.geometries.push(newControl1);
            newCmd.control1 = newControl1Id;
          }
          if (cmd.control2) {
            const newControl2Id = createRandStr(4);
            const newControl2XId = createRandStr(4);
            const newControl2YId = createRandStr(4);

            // Create new control point
            const newControl2 = {
              ...STATE.geometries.find((g) => g.id === cmd.control2),
              id: newControl2Id,
              x: newControl2XId,
              y: newControl2YId,
              layer: newId,
            };

            // Copy control point param values
            STATE.params[newControl2XId] = STATE.params[newControl2.x];
            STATE.params[newControl2YId] = STATE.params[newControl2.y];

            STATE.geometries.push(newControl2);
            newCmd.control2 = newControl2Id;
          }
          return newCmd;
        });
      } else if (geo.type === "line") {
        newGeo.p1 = geometryMap.get(geo.p1);
        newGeo.p2 = geometryMap.get(geo.p2);
      }

      geometryMap.set(geo.id, newGeoId);
      STATE.geometries.push(newGeo);
    }
  });

  // Add the new layer
  STATE.layers.push(newLayer);

  // Set the new layer as active
  STATE.activeLayer = newId;

  // Re-evaluate all layers
  evaluateAllLayers();
}
