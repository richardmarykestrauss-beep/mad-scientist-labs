import "@testing-library/jest-dom";

// The test harness opts into local demo mode explicitly. Individual tests call
// resolveDataMode with missing/invalid values to verify fail-closed behavior.
import.meta.env.VITE_DATA_MODE = "local";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
