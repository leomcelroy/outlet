import { createRandStr } from "./createRandStr.js";

export function duplicateAndReidentify(toDuplicate) {
  console.log({ toDuplicate });
  const { layers, geometries, params } = JSON.parse(
    JSON.stringify(toDuplicate)
  );

  // Create maps to track ID changes
  const layerIdMap = new Map(); // Maps old layer IDs to new ones
  const geometryIdMap = new Map(); // Maps old geometry IDs to new ones
  const paramIdMap = new Map(); // Maps old param IDs to new ones

  // First pass: Generate new IDs for layers and create mapping
  const newLayers = layers.map((layer) => {
    const newId = `LAYER_${createRandStr()}`;
    layerIdMap.set(layer.id, newId);

    return { ...layer, id: newId };
  });

  // Update parent references in layers
  newLayers.forEach((layer) => {
    if (layer.parent) {
      layer.parent = layerIdMap.get(layer.parent);
    }
    if (layer.children) {
      layer.children = layer.children.map((childId) => layerIdMap.get(childId));
    }
  });

  // Second pass: Generate new IDs for geometries and params
  const newGeometries = geometries.map((geo) => {
    const newGeo = { ...geo };
    newGeo.id = `GEO_${createRandStr()}`;
    geometryIdMap.set(geo.id, newGeo.id);

    // Update layer reference
    newGeo.layer = layerIdMap.get(geo.layer);

    if (geo.type === "point") {
      const newXId = `X_${createRandStr()}`;
      const newYId = `Y_${createRandStr()}`;
      paramIdMap.set(geo.x, newXId);
      paramIdMap.set(geo.y, newYId);
      newGeo.x = newXId;
      newGeo.y = newYId;
    } else if (geo.type === "edge") {
      newGeo.p1 = geometryIdMap.get(geo.p1);
      newGeo.p2 = geometryIdMap.get(geo.p2);
    }

    return newGeo;
  });

  // Third pass: Create new params with new IDs
  const newParams = {};
  for (const [oldId, value] of Object.entries(params)) {
    const newId = paramIdMap.get(oldId);
    if (newId) {
      // Copy the parameter value to the new ID
      newParams[newId] = value;
    }
  }

  // Ensure all point parameters are properly copied
  geometries.forEach((geo) => {
    if (geo.type === "point") {
      const newXId = paramIdMap.get(geo.x);
      const newYId = paramIdMap.get(geo.y);

      if (newXId && params[geo.x] !== undefined) {
        newParams[newXId] = params[geo.x];
      }

      if (newYId && params[geo.y] !== undefined) {
        newParams[newYId] = params[geo.y];
      }
    }
  });

  return {
    layers: newLayers,
    geometries: newGeometries,
    params: newParams,
  };
}
