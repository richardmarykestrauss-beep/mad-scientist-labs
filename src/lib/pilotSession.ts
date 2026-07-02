export const PILOT_SESSION_CACHE_KEYS = [
  "mad-scientist-pilot-profile",
  "mad-scientist-pilot-check-ins",
  "mad-scientist-pilot-reviews",
] as const;

export function clearPilotSessionCaches(storage: Storage = sessionStorage): void {
  for (const key of PILOT_SESSION_CACHE_KEYS) storage.removeItem(key);
}
