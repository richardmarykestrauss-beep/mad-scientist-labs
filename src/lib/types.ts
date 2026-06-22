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

export interface CheckIn {
  id: string;
  clientId: string;
  date: string;
  bodyWeightKg: number;
  energyScore: number;
  sleepQuality: number;
  moodScore: number;
  stressScore: number;
  trainingAdherence: number;
  nutritionAdherence: number;
  digestionNotes: string;
  winsThisWeek: string;
  strugglesThisWeek: string;
  questionForCoach: string;
}

export interface ExerciseLog {
  id: string;
  clientId: string;
  date: string;
  exerciseName: string;
  completedSets: boolean[];
}

export interface SupplementLog {
  id: string;
  clientId: string;
  date: string;
  supplementName: string;
  completed: boolean;
}

// Nutrition plan related types
export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  fluidIntakeLiters: number;
}

export interface MealTimingBlock {
  name: string;
  time: string; // HH:MM
}

export interface NutritionFocusArea {
  name: string;
  completed: boolean;
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  date: string; // ISO date of plan creation
  macroTargets: MacroTargets;
  adherence: number; // 0-100
  focusAreas: NutritionFocusArea[];
  mealTiming: MealTimingBlock[];
}

// Training / Exercise Library related types
export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core";
export type EquipmentType = "Barbell" | "Dumbbell" | "Cables" | "Machine" | "Bodyweight";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  equipment: EquipmentType;
  cues: string[];
  mistakes: string[];
}

export interface TrainingPlanExercise {
  id: string; // instance ID
  exerciseId: string;
  name: string;
  primaryMuscle: MuscleGroup;
  equipment: EquipmentType;
  sets: number;
  repsPrescription: string; // e.g. "8-10" or "RPE 9"
  tempo: string; // e.g. "3010"
  restSeconds: number;
}

export interface TrainingDay {
  id: string;
  dayName: string; // e.g. "Day 1: Upper Push"
  exercises: TrainingPlanExercise[];
}

export interface TrainingPlan {
  id: string;
  clientId: string;
  programName: string; // e.g. "Hypertrophy Phase 1"
  days: TrainingDay[];
  notes: string;
}

// Supplement Protocol related types
export type SupplementCategory =
  | "Hormonal Support"
  | "Metabolic Optimization"
  | "Micronutrient Support"
  | "Nootropic/CNS"
  | "Sleep & Recovery"
  | "Custom";

export type SupplementStatus = "active" | "paused" | "archived";

export interface SupplementProtocolItem {
  id: string;
  name: string;
  category: SupplementCategory;
  dose: number;
  unit: string; // e.g. "mg", "capsules", "IU"
  timing: string; // e.g. "Morning, with food"
  frequency: string; // e.g. "Daily", "Training Days"
  supportFocus: string; // e.g. "Thyroid support", "Cellular energy"
  linkedBiomarkerKey?: string; // Optional links to biomarker
  status: SupplementStatus;
  coachNote?: string;
  clientInstruction?: string;
}

export interface SupplementProtocol {
  id: string;
  clientId: string;
  items: SupplementProtocolItem[];
  updatedAt: string; // ISO timestamp
}

export type CoachNoteCategory =
  | "Lab Review"
  | "Training"
  | "Nutrition"
  | "Supplements"
  | "Check-In"
  | "General"
  | "Follow-Up";

export type CoachNoteVisibility = "private" | "client_safe";

export interface CoachNoteMessage {
  id: string;
  senderRole: "coach" | "client";
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface CoachNote {
  id: string;
  clientId: string;
  title: string;
  body: string;
  category: CoachNoteCategory;
  visibility: CoachNoteVisibility;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  followUpDate?: string;
  acknowledgedByClient?: boolean;
  acknowledgedAt?: string;
  messages?: CoachNoteMessage[];
}
