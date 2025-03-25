export function addCaching(state) {
  // Load initial state from session storage
  const cachedState = sessionStorage.getItem("sketchState");
  if (cachedState) {
    const newState = JSON.parse(cachedState);
    for (const key in newState) {
      state[key] = newState[key];
    }
  }

  // Save state every 5 seconds
  setInterval(() => {
    const file = JSON.stringify({
      geometries: state.geometries,
      params: state.params,
    });
    sessionStorage.setItem("sketchState", file);
  }, 5000);
}
