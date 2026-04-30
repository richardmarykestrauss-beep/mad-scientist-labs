import type { BiomarkerDef, BiomarkerStatus } from "./types";

export const BIOMARKERS: BiomarkerDef[] = [
  // Glucose
  { key: "fasting_glucose", name: "Fasting Glucose", category: "Glucose", unit: "mg/dL", standardLow: 70, standardHigh: 99, optimalLow: 75, optimalHigh: 86, clientExplanation: "Your blood sugar after fasting. Lower-optimal values reflect strong insulin sensitivity." },
  { key: "hba1c", name: "HbA1c", category: "Glucose", unit: "%", standardLow: 4.0, standardHigh: 5.6, optimalLow: 4.6, optimalHigh: 5.2, clientExplanation: "3-month average of blood sugar control." },
  { key: "eag", name: "eAG", category: "Glucose", unit: "mg/dL", standardLow: 70, standardHigh: 114, optimalLow: 80, optimalHigh: 100 },
  { key: "tyg_index", name: "Triglyceride-Glucose Index", category: "Glucose", unit: "", standardLow: 4.0, standardHigh: 8.5, optimalLow: 4.0, optimalHigh: 8.0 },
  // Renal
  { key: "bun", name: "BUN", category: "Renal", unit: "mg/dL", standardLow: 7, standardHigh: 20, optimalLow: 12, optimalHigh: 18 },
  { key: "creatinine", name: "Creatinine", category: "Renal", unit: "mg/dL", standardLow: 0.6, standardHigh: 1.3, optimalLow: 0.8, optimalHigh: 1.1 },
  { key: "egfr", name: "eGFR", category: "Renal", unit: "mL/min", standardLow: 60, standardHigh: 120, optimalLow: 90, optimalHigh: 120 },
  { key: "uric_acid", name: "Uric Acid", category: "Renal", unit: "mg/dL", standardLow: 3.5, standardHigh: 7.2, optimalLow: 4.0, optimalHigh: 5.5 },
  // Proteins
  { key: "total_protein", name: "Total Protein", category: "Proteins", unit: "g/dL", standardLow: 6.0, standardHigh: 8.3, optimalLow: 6.9, optimalHigh: 7.4 },
  { key: "albumin", name: "Albumin", category: "Proteins", unit: "g/dL", standardLow: 3.5, standardHigh: 5.0, optimalLow: 4.3, optimalHigh: 4.8 },
  { key: "globulin", name: "Globulin", category: "Proteins", unit: "g/dL", standardLow: 2.0, standardHigh: 3.5, optimalLow: 2.4, optimalHigh: 2.8 },
  { key: "ag_ratio", name: "Albumin/Globulin Ratio", category: "Proteins", unit: "", standardLow: 1.0, standardHigh: 2.5, optimalLow: 1.5, optimalHigh: 2.0 },
  // Minerals
  { key: "calcium", name: "Calcium", category: "Minerals", unit: "mg/dL", standardLow: 8.6, standardHigh: 10.2, optimalLow: 9.2, optimalHigh: 9.8 },
  // Liver & Gallbladder
  { key: "alp", name: "ALP", category: "Liver & Gallbladder", unit: "U/L", standardLow: 44, standardHigh: 147, optimalLow: 60, optimalHigh: 90 },
  { key: "ast", name: "AST", category: "Liver & Gallbladder", unit: "U/L", standardLow: 8, standardHigh: 33, optimalLow: 10, optimalHigh: 22 },
  { key: "alt", name: "ALT", category: "Liver & Gallbladder", unit: "U/L", standardLow: 7, standardHigh: 56, optimalLow: 10, optimalHigh: 22 },
  { key: "ggt", name: "GGT", category: "Liver & Gallbladder", unit: "U/L", standardLow: 9, standardHigh: 48, optimalLow: 10, optimalHigh: 22 },
  { key: "total_bilirubin", name: "Total Bilirubin", category: "Liver & Gallbladder", unit: "mg/dL", standardLow: 0.1, standardHigh: 1.2, optimalLow: 0.4, optimalHigh: 0.9 },
  { key: "direct_bilirubin", name: "Direct Bilirubin", category: "Liver & Gallbladder", unit: "mg/dL", standardLow: 0.0, standardHigh: 0.3, optimalLow: 0.1, optimalHigh: 0.2 },
  { key: "indirect_bilirubin", name: "Indirect Bilirubin", category: "Liver & Gallbladder", unit: "mg/dL", standardLow: 0.1, standardHigh: 1.0, optimalLow: 0.3, optimalHigh: 0.7 },
  // Iron
  { key: "serum_iron", name: "Serum Iron", category: "Iron", unit: "µg/dL", standardLow: 60, standardHigh: 170, optimalLow: 85, optimalHigh: 130 },
  { key: "tibc", name: "TIBC", category: "Iron", unit: "µg/dL", standardLow: 240, standardHigh: 450, optimalLow: 250, optimalHigh: 350 },
  { key: "uibc", name: "UIBC", category: "Iron", unit: "µg/dL", standardLow: 150, standardHigh: 375, optimalLow: 175, optimalHigh: 275 },
  { key: "transferrin_sat", name: "Transferrin Saturation", category: "Iron", unit: "%", standardLow: 20, standardHigh: 50, optimalLow: 30, optimalHigh: 40 },
  { key: "ferritin", name: "Ferritin", category: "Iron", unit: "ng/mL", standardLow: 20, standardHigh: 250, optimalLow: 70, optimalHigh: 150 },
  // Lipids
  { key: "total_cholesterol", name: "Total Cholesterol", category: "Lipids", unit: "mg/dL", standardLow: 125, standardHigh: 200, optimalLow: 160, optimalHigh: 200 },
  { key: "ldl", name: "LDL", category: "Lipids", unit: "mg/dL", standardLow: 0, standardHigh: 100, optimalLow: 60, optimalHigh: 100 },
  { key: "hdl", name: "HDL", category: "Lipids", unit: "mg/dL", standardLow: 40, standardHigh: 100, optimalLow: 55, optimalHigh: 80 },
  { key: "non_hdl", name: "Non-HDL Cholesterol", category: "Lipids", unit: "mg/dL", standardLow: 0, standardHigh: 130, optimalLow: 80, optimalHigh: 130 },
  { key: "vldl", name: "VLDL", category: "Lipids", unit: "mg/dL", standardLow: 5, standardHigh: 40, optimalLow: 5, optimalHigh: 20 },
  { key: "triglycerides", name: "Triglycerides", category: "Lipids", unit: "mg/dL", standardLow: 0, standardHigh: 150, optimalLow: 40, optimalHigh: 90 },
  // Cardiometabolic ratios
  { key: "tc_hdl_ratio", name: "Total Chol / HDL Ratio", category: "Cardiometabolic", unit: "", standardLow: 0, standardHigh: 5, optimalLow: 2.0, optimalHigh: 3.5 },
  { key: "tg_hdl_ratio", name: "Triglyceride / HDL Ratio", category: "Cardiometabolic", unit: "", standardLow: 0, standardHigh: 3, optimalLow: 0.5, optimalHigh: 1.5 },
  { key: "ldl_hdl_ratio", name: "LDL / HDL Ratio", category: "Cardiometabolic", unit: "", standardLow: 0, standardHigh: 3.5, optimalLow: 1.0, optimalHigh: 2.5 },
  { key: "aip", name: "Atherogenic Index of Plasma", category: "Cardiometabolic", unit: "", standardLow: -0.3, standardHigh: 0.21, optimalLow: -0.3, optimalHigh: 0.1 },
  // Thyroid
  { key: "tsh", name: "TSH", category: "Thyroid", unit: "µIU/mL", standardLow: 0.4, standardHigh: 4.5, optimalLow: 1.0, optimalHigh: 2.0 },
  { key: "free_t4", name: "Free T4", category: "Thyroid", unit: "ng/dL", standardLow: 0.8, standardHigh: 1.8, optimalLow: 1.1, optimalHigh: 1.5 },
  { key: "free_t3", name: "Free T3", category: "Thyroid", unit: "pg/mL", standardLow: 2.3, standardHigh: 4.2, optimalLow: 3.2, optimalHigh: 4.0 },
  { key: "ft3_ft4_ratio", name: "Free T3 / Free T4 Ratio", category: "Thyroid", unit: "", standardLow: 1.5, standardHigh: 4.5, optimalLow: 2.5, optimalHigh: 3.5 },
  // Inflammation
  { key: "nlr", name: "Neutrophil/Lymphocyte Ratio", category: "Inflammation", unit: "", standardLow: 0.78, standardHigh: 3.5, optimalLow: 1.0, optimalHigh: 2.0 },
  { key: "plr", name: "Platelet/Lymphocyte Ratio", category: "Inflammation", unit: "", standardLow: 50, standardHigh: 200, optimalLow: 80, optimalHigh: 150 },
  // Vitamins
  { key: "vitamin_d", name: "Vitamin D", category: "Vitamins", unit: "ng/mL", standardLow: 30, standardHigh: 100, optimalLow: 50, optimalHigh: 80 },
  { key: "vitamin_b12", name: "Vitamin B12", category: "Vitamins", unit: "pg/mL", standardLow: 200, standardHigh: 900, optimalLow: 600, optimalHigh: 900 },
  // Hormones
  { key: "fsh", name: "FSH", category: "Hormones", unit: "mIU/mL", standardLow: 1.5, standardHigh: 12.4, optimalLow: 2.0, optimalHigh: 8.0 },
  { key: "lh", name: "LH", category: "Hormones", unit: "mIU/mL", standardLow: 1.7, standardHigh: 8.6, optimalLow: 3.0, optimalHigh: 7.0 },
  { key: "free_test", name: "Free Testosterone", category: "Hormones", unit: "pg/mL", standardLow: 47, standardHigh: 244, optimalLow: 150, optimalHigh: 220 },
  { key: "total_test", name: "Total Testosterone", category: "Hormones", unit: "ng/dL", standardLow: 264, standardHigh: 916, optimalLow: 600, optimalHigh: 900 },
  { key: "bio_test", name: "Bioavailable Testosterone", category: "Hormones", unit: "ng/dL", standardLow: 110, standardHigh: 575, optimalLow: 300, optimalHigh: 500 },
  { key: "estradiol", name: "Estradiol", category: "Hormones", unit: "pg/mL", standardLow: 10, standardHigh: 40, optimalLow: 20, optimalHigh: 30 },
  { key: "prolactin", name: "Prolactin", category: "Hormones", unit: "ng/mL", standardLow: 4, standardHigh: 18, optimalLow: 5, optimalHigh: 12 },
  // RBC
  { key: "rbc", name: "RBC", category: "Red Blood Cells", unit: "M/µL", standardLow: 4.2, standardHigh: 5.9, optimalLow: 4.6, optimalHigh: 5.4 },
  { key: "hemoglobin", name: "Hemoglobin", category: "Red Blood Cells", unit: "g/dL", standardLow: 13.5, standardHigh: 17.5, optimalLow: 14.5, optimalHigh: 16.5 },
  { key: "hematocrit", name: "Hematocrit", category: "Red Blood Cells", unit: "%", standardLow: 38, standardHigh: 50, optimalLow: 42, optimalHigh: 48 },
  { key: "mcv", name: "MCV", category: "Red Blood Cells", unit: "fL", standardLow: 80, standardHigh: 100, optimalLow: 88, optimalHigh: 92 },
  { key: "mch", name: "MCH", category: "Red Blood Cells", unit: "pg", standardLow: 27, standardHigh: 33, optimalLow: 28, optimalHigh: 31 },
  { key: "mchc", name: "MCHC", category: "Red Blood Cells", unit: "g/dL", standardLow: 32, standardHigh: 36, optimalLow: 33, optimalHigh: 35 },
  { key: "platelets", name: "Platelets", category: "Red Blood Cells", unit: "K/µL", standardLow: 150, standardHigh: 400, optimalLow: 200, optimalHigh: 300 },
  { key: "mpv", name: "MPV", category: "Red Blood Cells", unit: "fL", standardLow: 7.5, standardHigh: 11.5, optimalLow: 8.5, optimalHigh: 10.5 },
  { key: "rdw", name: "RDW", category: "Red Blood Cells", unit: "%", standardLow: 11.5, standardHigh: 14.5, optimalLow: 12.0, optimalHigh: 13.5 },
  // WBC
  { key: "wbc", name: "Total WBC", category: "White Blood Cells", unit: "K/µL", standardLow: 4.0, standardHigh: 11.0, optimalLow: 5.0, optimalHigh: 7.5 },
  { key: "neutrophils_pct", name: "Neutrophils %", category: "White Blood Cells", unit: "%", standardLow: 40, standardHigh: 70, optimalLow: 50, optimalHigh: 60 },
  { key: "lymphocytes_pct", name: "Lymphocytes %", category: "White Blood Cells", unit: "%", standardLow: 20, standardHigh: 45, optimalLow: 28, optimalHigh: 38 },
  { key: "monocytes_pct", name: "Monocytes %", category: "White Blood Cells", unit: "%", standardLow: 2, standardHigh: 10, optimalLow: 4, optimalHigh: 7 },
  { key: "eosinophils_pct", name: "Eosinophils %", category: "White Blood Cells", unit: "%", standardLow: 0, standardHigh: 6, optimalLow: 1, optimalHigh: 3 },
  { key: "basophils_pct", name: "Basophils %", category: "White Blood Cells", unit: "%", standardLow: 0, standardHigh: 2, optimalLow: 0, optimalHigh: 1 },
  { key: "abs_neutrophils", name: "Absolute Neutrophils", category: "White Blood Cells", unit: "K/µL", standardLow: 1.8, standardHigh: 7.7, optimalLow: 3.0, optimalHigh: 5.0 },
  { key: "abs_lymphocytes", name: "Absolute Lymphocytes", category: "White Blood Cells", unit: "K/µL", standardLow: 1.0, standardHigh: 4.8, optimalLow: 1.8, optimalHigh: 3.0 },
  { key: "abs_monocytes", name: "Absolute Monocytes", category: "White Blood Cells", unit: "K/µL", standardLow: 0.2, standardHigh: 1.0, optimalLow: 0.3, optimalHigh: 0.6 },
  { key: "abs_eosinophils", name: "Absolute Eosinophils", category: "White Blood Cells", unit: "K/µL", standardLow: 0, standardHigh: 0.5, optimalLow: 0.05, optimalHigh: 0.3 },
  { key: "abs_basophils", name: "Absolute Basophils", category: "White Blood Cells", unit: "K/µL", standardLow: 0, standardHigh: 0.2, optimalLow: 0, optimalHigh: 0.1 },
];

export const BIOMARKER_MAP: Record<string, BiomarkerDef> = Object.fromEntries(
  BIOMARKERS.map((b) => [b.key, b])
);

export const CATEGORIES: { key: string; label: string }[] = [
  { key: "Glucose", label: "Blood Glucose" },
  { key: "Renal", label: "Renal" },
  { key: "Metabolic", label: "Metabolic" },
  { key: "Proteins", label: "Proteins" },
  { key: "Minerals", label: "Minerals" },
  { key: "Liver & Gallbladder", label: "Liver & Gallbladder" },
  { key: "Iron", label: "Iron" },
  { key: "Lipids", label: "Lipids" },
  { key: "Cardiometabolic", label: "Cardiometabolic" },
  { key: "Thyroid", label: "Thyroid" },
  { key: "Inflammation", label: "Inflammation" },
  { key: "Vitamins", label: "Vitamins" },
  { key: "Hormones", label: "Hormones" },
  { key: "Red Blood Cells", label: "Red Blood Cells" },
  { key: "White Blood Cells", label: "White Blood Cells" },
];

export function getStatus(def: BiomarkerDef, value: number): BiomarkerStatus {
  if (value < def.standardLow) return "low";
  if (value > def.standardHigh) return "high";
  if (value < def.optimalLow) return "below-optimal";
  if (value > def.optimalHigh) return "above-optimal";
  return "optimal";
}

export const STATUS_META: Record<BiomarkerStatus, { label: string; color: string; dot: string; ring: string }> = {
  low:            { label: "Low",            color: "text-status-low",      dot: "bg-status-low",      ring: "ring-status-low/40" },
  "below-optimal":{ label: "Below Optimal",  color: "text-status-below",    dot: "bg-status-below",    ring: "ring-status-below/40" },
  optimal:        { label: "Optimal",        color: "text-status-optimal",  dot: "bg-status-optimal",  ring: "ring-status-optimal/40" },
  "above-optimal":{ label: "Above Optimal",  color: "text-status-above",    dot: "bg-status-above",    ring: "ring-status-above/40" },
  high:           { label: "High",           color: "text-status-high",     dot: "bg-status-high",     ring: "ring-status-high/40" },
  untested:       { label: "Not Tested",     color: "text-status-untested", dot: "bg-status-untested", ring: "ring-status-untested/40" },
};

export function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}
