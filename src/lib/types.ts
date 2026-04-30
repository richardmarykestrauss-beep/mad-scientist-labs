export type Role = "coach" | "client";

export type BiomarkerCategory =
  | "Glucose"
  | "Renal"
  | "Metabolic"
  | "Proteins"
  | "Minerals"
  | "Liver & Gallbladder"
  | "Iron"
  | "Lipids"
  | "Cardiometabolic"
  | "Thyroid"
  | "Inflammation"
  | "Vitamins"
  | "Hormones"
  | "Red Blood Cells"
  | "White Blood Cells";

export type BiomarkerStatus =
  | "low"
  | "below-optimal"
  | "optimal"
  | "above-optimal"
  | "high"
  | "untested";

export interface BiomarkerDef {
  key: string;
  name: string;
  category: BiomarkerCategory;
  unit: string;
  standardLow: number;
  standardHigh: number;
  optimalLow: number;
  optimalHigh: number;
  clientExplanation?: string;
}

export interface BiomarkerResult {
  key: string;
  value: number;
  coachNote?: string;
}

export interface BloodPanel {
  id: string;
  clientId: string;
  date: string; // ISO
  label?: string;
  results: BiomarkerResult[];
  coachSummary?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
  goal: string;
  bodyWeightKg: number;
  startedAt: string;
  status: "active" | "review" | "inactive";
  trainingCompliance: number; // 0-100
  nutritionCompliance: number; // 0-100
  nextCheckIn: string;
  notes?: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  initials: string;
}
