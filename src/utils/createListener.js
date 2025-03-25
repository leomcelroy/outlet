export function createListener(target) {
  return (eventName, selectorString, event) => {
    target.addEventListener(eventName, (e) => {
      const matches = selectorString === "" || e.target.matches(selectorString);
      if (matches) event(e);
    });
  };
}
