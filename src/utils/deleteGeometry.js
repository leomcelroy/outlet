import { STATE } from "../index.js";
import { evaluateAllLayers } from "./evaluateAllLayers";

export function deleteGeometry() {
  const toRemove = new Set();

  // Add selected geometry to removal set
  STATE.selectedGeometry.forEach((id) => {
    toRemove.add(id);
  });

  // Find and add edges that reference the deleted geometry
  STATE.geometries.forEach((geo) => {
    if (geo.type === "edge" && (toRemove.has(geo.p1) || toRemove.has(geo.p2))) {
      toRemove.add(geo.id);
    }
  });

  // Remove all selected geometry and their referenced edges
  STATE.geometries = STATE.geometries.filter((geo) => !toRemove.has(geo.id));

  // Remove edges that reference non-existent points
  const existingPointIds = new Set(
    STATE.geometries.filter((geo) => geo.type === "point").map((geo) => geo.id)
  );
  STATE.geometries = STATE.geometries.filter((geo) => {
    if (geo.type !== "edge") return true;
    return (
      existingPointIds.has(geo.p1) &&
      existingPointIds.has(geo.p2) &&
      (!geo.c1 || existingPointIds.has(geo.c1)) &&
      (!geo.c2 || existingPointIds.has(geo.c2))
    );
  });

  // Find orphaned points (points with no edges)
  const remainingPoints = STATE.geometries.filter(
    (geo) => geo.type === "point"
  );
  const remainingEdges = STATE.geometries.filter((geo) => geo.type === "edge");

  // Create a set of points that have edges
  const pointsWithEdges = new Set();
  remainingEdges.forEach((edge) => {
    pointsWithEdges.add(edge.p1);
    pointsWithEdges.add(edge.p2);
    if (edge.c1) pointsWithEdges.add(edge.c1);
    if (edge.c2) pointsWithEdges.add(edge.c2);
  });

  // Add orphaned points to removal set
  remainingPoints.forEach((point) => {
    if (!pointsWithEdges.has(point.id)) {
      toRemove.add(point.id);
    }
  });

  // Remove orphaned points
  STATE.geometries = STATE.geometries.filter((geo) => !toRemove.has(geo.id));

  // Clean up unused parameters
  const usedParams = new Set();
  STATE.geometries.forEach((geo) => {
    if (geo.type === "point") {
      usedParams.add(geo.x);
      usedParams.add(geo.y);
    } else if (geo.type === "edge") {
      if (geo.c1) usedParams.add(geo.c1);
      if (geo.c2) usedParams.add(geo.c2);
    }
  });

  // Remove unused parameters
  Object.keys(STATE.params).forEach((paramId) => {
    if (!usedParams.has(paramId)) {
      delete STATE.params[paramId];
    }
  });

  // Reset drawing state
  STATE.currentPoint = null;
  STATE.edgeStart = null;

  evaluateAllLayers();
}
