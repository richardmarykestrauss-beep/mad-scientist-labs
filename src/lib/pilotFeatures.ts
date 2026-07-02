import type { DataMode } from "./supabase";

export type PilotFeatureStatus = "live" | "demo" | "disabled";
export type PilotFeature =
  | "login"
  | "clientIdentity"
  | "weeklyCheckIns"
  | "coachReviews"
  | "training"
  | "nutrition"
  | "supplements"
  | "labs"
  | "recommendations"
  | "coachNotes";

export const SUPABASE_PILOT_FEATURES: Record<PilotFeature, PilotFeatureStatus> = {
  login: "live",
  clientIdentity: "live",
  weeklyCheckIns: "live",
  coachReviews: "live",
  training: "disabled",
  nutrition: "disabled",
  supplements: "disabled",
  labs: "disabled",
  recommendations: "disabled",
  coachNotes: "disabled",
};

export const LOCAL_DEMO_FEATURES: Record<PilotFeature, PilotFeatureStatus> = {
  login: "demo",
  clientIdentity: "demo",
  weeklyCheckIns: "demo",
  coachReviews: "demo",
  training: "demo",
  nutrition: "demo",
  supplements: "demo",
  labs: "demo",
  recommendations: "demo",
  coachNotes: "demo",
};

export function featureStatus(mode: DataMode, feature: PilotFeature): PilotFeatureStatus {
  return mode === "supabase" ? SUPABASE_PILOT_FEATURES[feature] : LOCAL_DEMO_FEATURES[feature];
}

export function canUseLocalPrototype(mode: DataMode): boolean {
  return mode === "local";
}

export function localPrototypeClientId(mode: DataMode, routeId?: string): string | null {
  return mode === "local" ? routeId || "c-001" : null;
}

export const PILOT_STATUS_COPY = "Pilot — Live check-ins and coach feedback";
export const PILOT_DISCLAIMER = "Prototype coaching support only. Not medical diagnosis or treatment.";
