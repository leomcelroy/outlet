import { STATE } from "../index.js";
import { evaluateAllLayers } from "../utils/evaluateAllLayers.js";

export function moveLayer(action) {
  const layers = STATE.layers;
  const { sourceId, targetId, position } = action;
  const source = layers.find((l) => l.id === sourceId);
  const target = layers.find((l) => l.id === targetId);
  if (!source || !target) return layers;

  // Don't allow moving a layer inside itself or its own descendants
  if (isDescendant(layers, sourceId, targetId)) return layers;

  // Remove source from any existing parent
  if (source.parent) {
    const oldParent = layers.find((l) => l.id === source.parent);
    if (oldParent) {
      oldParent.children = oldParent.children.filter((id) => id !== sourceId);
    }
  }
  source.parent = null;

  if (position === "inside") {
    // Source becomes a child of the target
    source.parent = targetId;
    if (!target.children.includes(sourceId)) {
      target.children.push(sourceId);
    }
  } else if (position === "before" || position === "after") {
    // If target is top-level, reorder top-level
    if (!target.parent) {
      source.parent = null;
      const sourceIndex = layers.findIndex((l) => l.id === sourceId);
      if (sourceIndex !== -1) {
        layers.splice(sourceIndex, 1);
      }
      const targetIndex = layers.findIndex((l) => l.id === targetId);
      if (targetIndex === -1) return layers;

      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      layers.splice(insertIndex, 0, source);
    } else {
      // If target has a parent, reorder within that parent's children
      const parentId = target.parent;
      source.parent = parentId;
      const parent = layers.find((l) => l.id === parentId);
      if (!parent) return layers;

      const targetIndex = parent.children.indexOf(targetId);
      if (targetIndex === -1) return layers;

      if (position === "before") {
        parent.children.splice(targetIndex, 0, sourceId);
      } else {
        parent.children.splice(targetIndex + 1, 0, sourceId);
      }
    }
  }

  evaluateAllLayers();
}

// Return true if `potentialDescendant` is the same as `node` or is contained within `node`'s subtree
function isDescendant(layers, node, potentialDescendant) {
  if (node === potentialDescendant) return true;
  const queue = [];
  const start = layers.find((l) => l.id === node);
  if (!start) return false;

  queue.push(...start.children);
  while (queue.length) {
    const current = queue.pop();
    if (current === potentialDescendant) return true;
    const next = layers.find((l) => l.id === current);
    if (next) queue.push(...next.children);
  }
  return false;
}
