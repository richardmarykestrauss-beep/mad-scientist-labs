import { useSyncExternalStore } from "react";
import type { BloodPanel, BiomarkerResult, CheckIn, ExerciseLog, SupplementLog, NutritionPlan, Exercise, TrainingPlan, SupplementProtocol, SupplementProtocolItem, SupplementCategory, SupplementStatus, CoachNote } from "@/lib/types";
import { CLIENTS, PANELS, COACH } from "./mock";
import { BIOMARKERS, getStatus } from "@/lib/biomarkers";
import { createId } from "@/lib/id";

type State = {
  coach: typeof COACH;
  clients: typeof CLIENTS;
  panels: BloodPanel[];
  checkIns: CheckIn[];
  exerciseLogs: ExerciseLog[];
  supplementLogs: SupplementLog[];
  nutritionPlans: NutritionPlan[];
  masterExercises: Exercise[];
  trainingPlans: TrainingPlan[];
  supplementProtocols: SupplementProtocol[];
  coachNotes: CoachNote[];
};

const LOCAL_STORAGE_KEY = "mad-scientist-lab-state";

const SEED_CHECKINS: CheckIn[] = [
  {
    id: "ch-1",
    clientId: "c-001",
    date: "2026-05-18",
    bodyWeightKg: 92.8,
    energyScore: 8,
    sleepQuality: 7,
    moodScore: 8,
    stressScore: 5,
    trainingAdherence: 92,
    nutritionAdherence: 86,
    digestionNotes: "Digestion is solid, keeping hydration high.",
    winsThisWeek: "Hit a PR on incline dumbbell press.",
    strugglesThisWeek: "Sleep was a bit inconsistent mid-week.",
    questionForCoach: "Should we increase creatine dosage during recomp?"
  },
  {
    id: "ch-2",
    clientId: "c-002",
    date: "2026-05-17",
    bodyWeightKg: 64.8,
    energyScore: 5,
    sleepQuality: 4,
    moodScore: 6,
    stressScore: 8,
    trainingAdherence: 78,
    nutritionAdherence: 71,
    digestionNotes: "Bloated in the evenings.",
    winsThisWeek: "Completed all planned cardio sessions.",
    strugglesThisWeek: "High work stress impacted sleep heavily.",
    questionForCoach: "My energy is really low in the afternoon, any ideas?"
  }
];

const SEED_EXERCISE_LOGS = (): ExerciseLog[] => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: "el-1", clientId: "c-001", date: today, exerciseName: "Incline Dumbbell Press", completedSets: [true, true, false, false] },
    { id: "el-2", clientId: "c-001", date: today, exerciseName: "Weighted Pull-ups", completedSets: [true, true, true, false] },
    { id: "el-3", clientId: "c-001", date: today, exerciseName: "Romanian Deadlifts (RDL)", completedSets: [false, false, false] },
    { id: "el-4", clientId: "c-001", date: today, exerciseName: "Lateral Raises", completedSets: [true, true, true, true] },
    { id: "el-5", clientId: "c-001", date: today, exerciseName: "Cambered Bar Skull Crushers", completedSets: [false, false, false] },
    
    { id: "el-6", clientId: "c-002", date: today, exerciseName: "Barbell Squats", completedSets: [true, true, true, false] },
    { id: "el-7", clientId: "c-002", date: today, exerciseName: "EZ Bar Bicep Curls", completedSets: [true, true, false] }
  ];
};

const SEED_SUPPLEMENT_LOGS = (): SupplementLog[] => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: "sl-1", clientId: "c-001", date: today, supplementName: "Vitamin D3 + K2", completed: true },
    { id: "sl-2", clientId: "c-001", date: today, supplementName: "Omega-3 Fish Oil", completed: true },
    { id: "sl-3", clientId: "c-001", date: today, supplementName: "Thyroid Complex (Iodine/Selenium)", completed: false },
    { id: "sl-4", clientId: "c-001", date: today, supplementName: "Magnesium Glycinate", completed: false },
    { id: "sl-5", clientId: "c-001", date: today, supplementName: "Creatine Monohydrate", completed: true },
    
    { id: "sl-6", clientId: "c-002", date: today, supplementName: "Thyroid Complex (Iodine/Selenium)", completed: true },
    { id: "sl-7", clientId: "c-002", date: today, supplementName: "Vitamin D3 + K2", completed: false },
    { id: "sl-8", clientId: "c-002", date: today, supplementName: "Magnesium Glycinate", completed: true }
  ];
};

const SEED_NUTRITION_PLANS = (): NutritionPlan[] => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: "np-1",
      clientId: "c-001",
      date: today,
      macroTargets: { calories: 2850, protein: 180, carbs: 250, fats: 70, fluidIntakeLiters: 3 },
      adherence: 86,
      focusAreas: [
        { name: "Protein timing", completed: true },
        { name: "Carb cycling", completed: false }
      ],
      mealTiming: [
        { name: "Breakfast", time: "08:00" },
        { name: "Lunch", time: "12:30" },
        { name: "Dinner", time: "19:00" }
      ]
    },
    {
      id: "np-2",
      clientId: "c-002",
      date: today,
      macroTargets: { calories: 2050, protein: 130, carbs: 200, fats: 55, fluidIntakeLiters: 2.5 },
      adherence: 71,
      focusAreas: [
        { name: "Meal timing", completed: true },
        { name: "Fat quality", completed: false }
      ],
      mealTiming: [
        { name: "Breakfast", time: "07:30" },
        { name: "Snack", time: "10:30" },
        { name: "Lunch", time: "13:00" },
        { name: "Dinner", time: "18:30" }
      ]
    }
  ];
};

const SEED_MASTER_EXERCISES = (): Exercise[] => {
  return [
    {
      id: "ex-1",
      name: "Barbell Bench Press",
      primaryMuscle: "Chest",
      equipment: "Barbell",
      cues: ["Keep elbows tucked to 45 degrees", "Leg drive through the floor", "Touch bar to lower sternum"],
      mistakes: ["Flaring elbows out wide", "Bouncing the bar off the chest", "Lifting hips off the bench"]
    },
    {
      id: "ex-2",
      name: "Incline Dumbbell Press",
      primaryMuscle: "Chest",
      equipment: "Dumbbell",
      cues: ["30-degree bench angle", "Control the stretch at the bottom", "Press in a slight inward arc"],
      mistakes: ["Bench angle too steep (front delts dominant)", "Touching weights at the top (loses tension)"]
    },
    {
      id: "ex-3",
      name: "Romanian Deadlift",
      primaryMuscle: "Legs",
      equipment: "Barbell",
      cues: ["Push hips back as far as possible", "Keep bar close to thighs", "Maintain flat back/neutral spine"],
      mistakes: ["Rounding the lower back", "Squatting the weight down rather than hinging"]
    },
    {
      id: "ex-4",
      name: "Back Squat",
      primaryMuscle: "Legs",
      equipment: "Barbell",
      cues: ["Sit back and down into hips", "Keep knees tracking over toes", "Chest up, drive through mid-foot"],
      mistakes: ["Knees caving inward (valgus)", "Heels rising off the floor", "Rounding upper back"]
    },
    {
      id: "ex-5",
      name: "Lat Pulldown",
      primaryMuscle: "Back",
      equipment: "Machine",
      cues: ["Drive elbows down to hips", "Slight lean back, pull to upper chest", "Control the eccentric phase"],
      mistakes: ["Using momentum (excessive swinging)", "Pulling bar down with forearms/wrist flexors"]
    },
    {
      id: "ex-6",
      name: "Seated Row",
      primaryMuscle: "Back",
      equipment: "Machine",
      cues: ["Pull shoulders down and back", "Squeeze shoulder blades", "Control the reach at the start"],
      mistakes: ["Rounding the shoulders at peak contraction", "Leaning too far forward/backward"]
    },
    {
      id: "ex-7",
      name: "Shoulder Press",
      primaryMuscle: "Shoulders",
      equipment: "Dumbbell",
      cues: ["Press straight up, biceps close to ears", "Keep core braced, back flat on bench", "Full range of motion"],
      mistakes: ["Arching the lower back excessively", "Flaring elbows to the sides"]
    },
    {
      id: "ex-8",
      name: "DB Lateral Raise",
      primaryMuscle: "Shoulders",
      equipment: "Dumbbell",
      cues: ["Lead with the elbows", "Slight forward lean", "Pour water/pinky high at the top"],
      mistakes: ["Using traps to shrug the weight up", "Swinging the dumbbells with hip drive"]
    },
    {
      id: "ex-9",
      name: "Cable Flye",
      primaryMuscle: "Chest",
      equipment: "Cables",
      cues: ["Hug a big tree", "Maintain a slight bend in the elbows", "Squeeze chests hard at center"],
      mistakes: ["Pressing the cables instead of flying", "Letting hands go behind shoulders at start"]
    },
    {
      id: "ex-10",
      name: "Bicep Curl",
      primaryMuscle: "Arms",
      equipment: "Dumbbell",
      cues: ["Keep elbows pinned to sides", "Supinate wrists at the top", "Squeeze bicep, control descent"],
      mistakes: ["Swinging elbows forward (uses front delts)", "Using lower back swing"]
    },
    {
      id: "ex-11",
      name: "Tricep Rope Pushdown",
      primaryMuscle: "Arms",
      equipment: "Cables",
      cues: ["Keep elbows pinned to ribs", "Spread the rope at the bottom", "Lock out tricep, slow release"],
      mistakes: ["Allowing shoulders to roll forward", "Letting elbows flare out"]
    },
    {
      id: "ex-12",
      name: "Plank",
      primaryMuscle: "Core",
      equipment: "Bodyweight",
      cues: ["Brace core like getting punched", "Keep hips in line with shoulders", "Squeeze glutes and quads"],
      mistakes: ["Sagging hips down", "Piking hips up", "Looking forward (strains neck)"]
    }
  ];
};

const SEED_TRAINING_PLANS = (): TrainingPlan[] => {
  return [
    {
      id: "tp-1",
      clientId: "c-001",
      programName: "Bio-Performance Hypertrophy",
      days: [
        {
          id: "tpd-1-1",
          dayName: "Day 1: Upper Push",
          exercises: [
            {
              id: "tpe-1-1-1",
              exerciseId: "ex-1",
              name: "Barbell Bench Press",
              primaryMuscle: "Chest",
              equipment: "Barbell",
              sets: 4,
              repsPrescription: "8-10 reps (RPE 8)",
              tempo: "3110",
              restSeconds: 120
            },
            {
              id: "tpe-1-1-2",
              exerciseId: "ex-2",
              name: "Incline Dumbbell Press",
              primaryMuscle: "Chest",
              equipment: "Dumbbell",
              sets: 3,
              repsPrescription: "10-12 reps",
              tempo: "2010",
              restSeconds: 90
            },
            {
              id: "tpe-1-1-3",
              exerciseId: "ex-7",
              name: "Shoulder Press",
              primaryMuscle: "Shoulders",
              equipment: "Dumbbell",
              sets: 3,
              repsPrescription: "10 reps",
              tempo: "2110",
              restSeconds: 90
            },
            {
              id: "tpe-1-1-4",
              exerciseId: "ex-11",
              name: "Tricep Rope Pushdown",
              primaryMuscle: "Arms",
              equipment: "Cables",
              sets: 3,
              repsPrescription: "12-15 reps",
              tempo: "2011",
              restSeconds: 60
            }
          ]
        },
        {
          id: "tpd-1-2",
          dayName: "Day 2: Upper Pull",
          exercises: [
            {
              id: "tpe-1-2-1",
              exerciseId: "ex-5",
              name: "Lat Pulldown",
              primaryMuscle: "Back",
              equipment: "Machine",
              sets: 4,
              repsPrescription: "10 reps",
              tempo: "3011",
              restSeconds: 90
            },
            {
              id: "tpe-1-2-2",
              exerciseId: "ex-6",
              name: "Seated Row",
              primaryMuscle: "Back",
              equipment: "Machine",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "2012",
              restSeconds: 90
            },
            {
              id: "tpe-1-2-3",
              exerciseId: "ex-8",
              name: "DB Lateral Raise",
              primaryMuscle: "Shoulders",
              equipment: "Dumbbell",
              sets: 4,
              repsPrescription: "15 reps",
              tempo: "2010",
              restSeconds: 60
            },
            {
              id: "tpe-1-2-4",
              exerciseId: "ex-10",
              name: "Bicep Curl",
              primaryMuscle: "Arms",
              equipment: "Dumbbell",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "3010",
              restSeconds: 60
            }
          ]
        },
        {
          id: "tpd-1-3",
          dayName: "Day 3: Lower & Core Focus",
          exercises: [
            {
              id: "tpe-1-3-1",
              exerciseId: "ex-4",
              name: "Back Squat",
              primaryMuscle: "Legs",
              equipment: "Barbell",
              sets: 4,
              repsPrescription: "6 reps (RPE 9)",
              tempo: "3110",
              restSeconds: 180
            },
            {
              id: "tpe-1-3-2",
              exerciseId: "ex-3",
              name: "Romanian Deadlift",
              primaryMuscle: "Legs",
              equipment: "Barbell",
              sets: 3,
              repsPrescription: "8-10 reps",
              tempo: "3010",
              restSeconds: 120
            },
            {
              id: "tpe-1-3-3",
              exerciseId: "ex-12",
              name: "Plank",
              primaryMuscle: "Core",
              equipment: "Bodyweight",
              sets: 3,
              repsPrescription: "60 seconds",
              tempo: "1010",
              restSeconds: 60
            }
          ]
        }
      ],
      notes: "Focus on strict tempo and technique consistency. Ensure core remains braced throughout squats and deadlifts to maintain back support."
    },
    {
      id: "tp-2",
      clientId: "c-002",
      programName: "Metabolic Conditioning & Strength",
      days: [
        {
          id: "tpd-2-1",
          dayName: "Day 1: Lower & Core",
          exercises: [
            {
              id: "tpe-2-1-1",
              exerciseId: "ex-3",
              name: "Romanian Deadlift",
              primaryMuscle: "Legs",
              equipment: "Barbell",
              sets: 4,
              repsPrescription: "10 reps",
              tempo: "3010",
              restSeconds: 90
            },
            {
              id: "tpe-2-1-2",
              exerciseId: "ex-12",
              name: "Plank",
              primaryMuscle: "Core",
              equipment: "Bodyweight",
              sets: 3,
              repsPrescription: "45 seconds",
              tempo: "1010",
              restSeconds: 60
            }
          ]
        },
        {
          id: "tpd-2-2",
          dayName: "Day 2: Upper Body & Arms",
          exercises: [
            {
              id: "tpe-2-2-1",
              exerciseId: "ex-5",
              name: "Lat Pulldown",
              primaryMuscle: "Back",
              equipment: "Machine",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "3011",
              restSeconds: 60
            },
            {
              id: "tpe-2-2-2",
              exerciseId: "ex-6",
              name: "Seated Row",
              primaryMuscle: "Back",
              equipment: "Machine",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "2012",
              restSeconds: 60
            },
            {
              id: "tpe-2-2-3",
              exerciseId: "ex-10",
              name: "Bicep Curl",
              primaryMuscle: "Arms",
              equipment: "Dumbbell",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "3010",
              restSeconds: 45
            },
            {
              id: "tpe-2-2-4",
              exerciseId: "ex-11",
              name: "Tricep Rope Pushdown",
              primaryMuscle: "Arms",
              equipment: "Cables",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "2011",
              restSeconds: 45
            }
          ]
        },
        {
          id: "tpd-2-3",
          dayName: "Day 3: Conditioning",
          exercises: [
            {
              id: "tpe-2-3-1",
              exerciseId: "ex-4",
              name: "Back Squat",
              primaryMuscle: "Legs",
              equipment: "Barbell",
              sets: 3,
              repsPrescription: "12 reps",
              tempo: "2010",
              restSeconds: 90
            },
            {
              id: "tpe-2-3-2",
              exerciseId: "ex-12",
              name: "Plank",
              primaryMuscle: "Core",
              equipment: "Bodyweight",
              sets: 3,
              repsPrescription: "60 seconds",
              tempo: "1010",
              restSeconds: 60
            }
          ]
        }
      ],
      notes: "Prioritize movement control and technique consistency over high loading. Keep rests strict to maximize metabolic output."
    }
  ];
};

const SEED_SUPPLEMENT_PROTOCOLS = (): SupplementProtocol[] => {
  return [
    {
      id: "sp-1",
      clientId: "c-001",
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "spi-1",
          name: "Vitamin D3 + K2",
          category: "Micronutrient Support",
          dose: 5000,
          unit: "IU",
          timing: "Morning, with breakfast",
          frequency: "Daily",
          supportFocus: "Bone density & androgen synthesis pathway support",
          linkedBiomarkerKey: "d3",
          status: "active",
          coachNote: "Linked to low baseline Vitamin D levels in Q1 labs.",
          clientInstruction: "Take with a meal containing fats to optimize absorption."
        },
        {
          id: "spi-2",
          name: "Magnesium Glycinate",
          category: "Sleep & Recovery",
          dose: 400,
          unit: "mg",
          timing: "Evening, 30-60 min before sleep",
          frequency: "Daily",
          supportFocus: "CNS relaxation & deep sleep pathway support",
          linkedBiomarkerKey: "mg",
          status: "active",
          coachNote: "Reference guardrail: standard active dose.",
          clientInstruction: "Improves recovery. Taken before sleep."
        },
        {
          id: "spi-3",
          name: "Thyroid Complex (Iodine/Selenium)",
          category: "Hormonal Support",
          dose: 1,
          unit: "capsule",
          timing: "Morning, with water",
          frequency: "Daily",
          supportFocus: "Thyroid hormone production support",
          linkedBiomarkerKey: "t3",
          status: "paused",
          coachNote: "Currently paused to assess baseline T3 recovery.",
          clientInstruction: "Temporary pause per coach review."
        }
      ]
    },
    {
      id: "sp-2",
      clientId: "c-002",
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "spi-4",
          name: "Vitamin D3 + K2",
          category: "Micronutrient Support",
          dose: 5000,
          unit: "IU",
          timing: "Morning, with breakfast",
          frequency: "Daily",
          supportFocus: "Micronutrient balance support",
          linkedBiomarkerKey: "d3",
          status: "active",
          coachNote: "Reference guardrail: standard winter target.",
          clientInstruction: "Take with food."
        },
        {
          id: "spi-5",
          name: "Magnesium Glycinate",
          category: "Sleep & Recovery",
          dose: 400,
          unit: "mg",
          timing: "Evening, 30-60 min before sleep",
          frequency: "Daily",
          supportFocus: "Sleep quality and muscle relaxation support",
          linkedBiomarkerKey: "mg",
          status: "active",
          coachNote: "Supports sleep latency.",
          clientInstruction: "Take before bed."
        }
      ]
    }
  ];
};

const SEED_COACH_NOTES = (): CoachNote[] => {
  return [
    {
      id: "cn-1",
      clientId: "c-001",
      title: "Q1 Thyroid Review",
      body: "T3 and T4 levels show mild recovery. Re-assess in Q2 labs. Keep current selenium supplementation active.",
      category: "Lab Review",
      visibility: "private",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: true,
      messages: []
    },
    {
      id: "cn-2",
      clientId: "c-001",
      title: "Sleep Adherence Check",
      body: "Client reports much better sleep quality since adding Magnesium Glycinate before bed. Monitor sleep latency over next two weeks.",
      category: "Check-In",
      visibility: "client_safe",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: false,
      acknowledgedByClient: true,
      acknowledgedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      messages: [
        {
          id: "msg-seed-1",
          senderRole: "coach",
          text: "Marcus, let's push the Magnesium Glycinate before bed this week. How has your sleep quality been?",
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "msg-seed-2",
          senderRole: "client",
          text: "Sleep latency has decreased significantly, waking up feeling refreshed.",
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "msg-seed-3",
          senderRole: "coach",
          text: "Excellent. Let's keep this protocol active for the next 14 days.",
          timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "cn-3",
      clientId: "c-002",
      title: "Metabolic Pathway Telemetry",
      body: "Calorie surplus is currently set to 250 kcal. Focus on keeping fat gain minimized while monitoring recovery.",
      category: "Nutrition",
      visibility: "private",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: true,
      messages: []
    }
  ];
};

const loadInitialState = (): State => {
  const defaultState: State = {
    coach: COACH,
    clients: [...CLIENTS],
    panels: [...PANELS],
    checkIns: [...SEED_CHECKINS],
    exerciseLogs: SEED_EXERCISE_LOGS(),
    supplementLogs: SEED_SUPPLEMENT_LOGS(),
    nutritionPlans: SEED_NUTRITION_PLANS(),
    masterExercises: SEED_MASTER_EXERCISES(),
    trainingPlans: SEED_TRAINING_PLANS(),
    supplementProtocols: SEED_SUPPLEMENT_PROTOCOLS(),
    coachNotes: SEED_COACH_NOTES()
  };
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.clients && parsed.panels) {
        return {
          coach: COACH,
          clients: parsed.clients,
          panels: parsed.panels,
          checkIns: parsed.checkIns || [...SEED_CHECKINS],
          exerciseLogs: parsed.exerciseLogs || SEED_EXERCISE_LOGS(),
          supplementLogs: parsed.supplementLogs || SEED_SUPPLEMENT_LOGS(),
          nutritionPlans: parsed.nutritionPlans || SEED_NUTRITION_PLANS(),
          masterExercises: parsed.masterExercises || SEED_MASTER_EXERCISES(),
          trainingPlans: parsed.trainingPlans || SEED_TRAINING_PLANS(),
          supplementProtocols: parsed.supplementProtocols || SEED_SUPPLEMENT_PROTOCOLS(),
          coachNotes: parsed.coachNotes || SEED_COACH_NOTES()
        };
      }
    }
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
  }
  return defaultState;
};

let state: State = loadInitialState();
const listeners = new Set<() => void>();

const saveState = (newState: State) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      clients: newState.clients,
      panels: newState.panels,
      checkIns: newState.checkIns,
      exerciseLogs: newState.exerciseLogs,
      supplementLogs: newState.supplementLogs,
      nutritionPlans: newState.nutritionPlans,
      masterExercises: newState.masterExercises,
      trainingPlans: newState.trainingPlans,
      supplementProtocols: newState.supplementProtocols,
      coachNotes: newState.coachNotes
    }));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
};

const emit = () => {
  saveState(state);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

const requireReflection = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
};

const appendCoachNoteMessage = (note: CoachNote, senderRole: "coach" | "client", text: string): CoachNote => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }

  const now = new Date();
  const messages = note.messages || [];
  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage &&
    lastMessage.senderRole === senderRole &&
    lastMessage.text === trimmed &&
    now.getTime() - new Date(lastMessage.timestamp).getTime() < 1500
  ) {
    return note;
  }

  return {
    ...note,
    messages: [
      ...messages,
      {
        id: createId("msg"),
        senderRole,
        text: trimmed,
        timestamp: now.toISOString()
      }
    ],
    updatedAt: now.toISOString()
  };
};

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const actions = {
  addPanel(clientId: string, date: string, label: string, results: BiomarkerResult[], summary?: string) {
    const panel: BloodPanel = { id: createId("p"), clientId, date, label, results, coachSummary: summary };
    state = { ...state, panels: [...state.panels, panel] };
    emit();
    return panel;
  },
  addClient(name: string, email: string, goal: string) {
    const id = createId("c");
    const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    state = {
      ...state,
      clients: [
        ...state.clients,
        {
          id, name, email, goal,
          avatarColor: "from-emerald-400 to-cyan-400",
          initials,
          bodyWeightKg: 0,
          startedAt: new Date().toISOString().slice(0, 10),
          status: "active",
          trainingCompliance: 0,
          nutritionCompliance: 0,
          nextCheckIn: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        },
      ],
    };
    emit();
    return id;
  },
  submitCheckIn(
    clientId: string,
    bodyWeightKg: number,
    energyScore: number,
    sleepQuality: number,
    moodScore: number,
    stressScore: number,
    trainingAdherence: number,
    nutritionAdherence: number,
    digestionNotes: string,
    winsThisWeek: string,
    strugglesThisWeek: string,
    questionForCoach: string
  ) {
    const client = state.clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error(`Client ${clientId} does not exist`);
    }
    if (isNaN(bodyWeightKg) || bodyWeightKg <= 0) {
      throw new Error("Invalid body weight");
    }
    const trimmedDigestionNotes = requireReflection(digestionNotes, "Digestion and recovery reflection");
    const trimmedWinsThisWeek = requireReflection(winsThisWeek, "Wins this week");
    const trimmedStrugglesThisWeek = requireReflection(strugglesThisWeek, "Struggles and bottlenecks");
    const trimmedQuestionForCoach = requireReflection(questionForCoach, "Questions or concerns");

    const today = new Date().toISOString().slice(0, 10);
    const weekKey = getWeekKey(today);

    // Duplicate check
    const duplicate = state.checkIns.some(
      (ch) => ch.clientId === clientId && (ch.weekKey === weekKey || getWeekKey(ch.date) === weekKey)
    );
    if (duplicate) {
      throw new Error("Weekly check-in already submitted for this week");
    }

    const newCheckIn: CheckIn = {
      id: createId("ch"),
      clientId,
      date: today,
      bodyWeightKg,
      energyScore,
      sleepQuality,
      moodScore,
      stressScore,
      trainingAdherence,
      nutritionAdherence,
      digestionNotes: trimmedDigestionNotes,
      winsThisWeek: trimmedWinsThisWeek,
      strugglesThisWeek: trimmedStrugglesThisWeek,
      questionForCoach: trimmedQuestionForCoach,
      submittedAt: new Date().toISOString(),
      weekKey,
      status: "needs_review"
    };

    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          bodyWeightKg,
          trainingCompliance: trainingAdherence,
          nutritionCompliance: nutritionAdherence,
          status: "review" as const
        };
      }
      return c;
    });

    state = {
      ...state,
      clients: updatedClients,
      checkIns: [newCheckIn, ...state.checkIns]
    };
    emit();
    return newCheckIn;
  },
  addCheckIn(
    clientId: string,
    bodyWeightKg: number,
    energyScore: number,
    sleepQuality: number,
    moodScore: number,
    stressScore: number,
    trainingAdherence: number,
    nutritionAdherence: number,
    digestionNotes: string,
    winsThisWeek: string,
    strugglesThisWeek: string,
    questionForCoach: string
  ) {
    return this.submitCheckIn(
      clientId,
      bodyWeightKg,
      energyScore,
      sleepQuality,
      moodScore,
      stressScore,
      trainingAdherence,
      nutritionAdherence,
      digestionNotes,
      winsThisWeek,
      strugglesThisWeek,
      questionForCoach
    );
  },
  reviewCheckIn(checkInId: string, feedback: string, reviewedBy: string) {
    if (!checkInId) {
      throw new Error("Check-in ID is required");
    }
    if (!feedback || !feedback.trim()) {
      throw new Error("Feedback cannot be empty");
    }

    const checkInIndex = state.checkIns.findIndex((ch) => ch.id === checkInId);
    if (checkInIndex === -1) {
      throw new Error("Check-in not found");
    }

    const checkIn = state.checkIns[checkInIndex];
    const updatedCheckIn: CheckIn = {
      ...checkIn,
      coachFeedback: feedback,
      status: "reviewed",
      reviewedAt: new Date().toISOString(),
      reviewedBy
    };

    const updatedCheckIns = [...state.checkIns];
    updatedCheckIns[checkInIndex] = updatedCheckIn;

    const clientId = checkIn.clientId;
    const client = state.clients.find((c) => c.id === clientId);

    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        // Check if other pending check-ins exist
        const otherPending = updatedCheckIns.some(
          (ch) => ch.clientId === clientId && ch.id !== checkInId && (ch.status === "needs_review" || ch.status === "submitted")
        );

        // Compliance checks
        const lowTraining = c.trainingCompliance < 75;
        const lowNutrition = c.nutritionCompliance < 75;

        // Overdue check-in
        const checkInOverdue = c.nextCheckIn <= "2026-05-26";

        // Lab alerts from latest blood panel
        const clientPanels = state.panels.filter((p) => p.clientId === c.id);
        const latestPanel = clientPanels.length > 0
          ? [...clientPanels].sort((a, b) => b.date.localeCompare(a.date))[0]
          : null;

        let hasLabAlerts = false;
        if (latestPanel) {
          for (const r of latestPanel.results) {
            const def = BIOMARKERS.find((b) => b.key === r.key);
            if (!def) continue;
            const status = getStatus(def, r.value);
            if (status === "high" || status === "low") {
              hasLabAlerts = true;
            }
          }
        }

        const hasOtherAttentionConditions = otherPending || lowTraining || lowNutrition || checkInOverdue || hasLabAlerts;

        return {
          ...c,
          status: hasOtherAttentionConditions ? ("review" as const) : ("active" as const)
        };
      }
      return c;
    });

    state = {
      ...state,
      clients: updatedClients,
      checkIns: updatedCheckIns
    };
    emit();
    return updatedCheckIn;
  },
  toggleExerciseSet(clientId: string, exerciseName: string, setIndex: number) {
    const today = new Date().toISOString().slice(0, 10);
    const logIndex = state.exerciseLogs.findIndex(
      (el) => el.clientId === clientId && el.exerciseName === exerciseName && el.date === today
    );

    const updatedLogs = [...state.exerciseLogs];
    if (logIndex > -1) {
      const log = state.exerciseLogs[logIndex];
      const completedSets = [...log.completedSets];
      completedSets[setIndex] = !completedSets[setIndex];
      updatedLogs[logIndex] = { ...log, completedSets };
    } else {
      const completedSets = [false, false, false, false];
      completedSets[setIndex] = true;
      updatedLogs.push({
        id: createId("el"),
        clientId,
        date: today,
        exerciseName,
        completedSets
      });
    }

    // Recalculate training compliance
    const clientLogs = updatedLogs.filter((l) => l.clientId === clientId && l.date === today);
    const totalSets = clientLogs.reduce((acc, l) => acc + l.completedSets.length, 0);
    const completedSetsCount = clientLogs.reduce((acc, l) => acc + l.completedSets.filter(Boolean).length, 0);
    const trainingAdherence = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        return { ...c, trainingCompliance: trainingAdherence };
      }
      return c;
    });

    state = {
      ...state,
      clients: updatedClients,
      exerciseLogs: updatedLogs
    };
    emit();
  },
  toggleSupplement(clientId: string, supplementName: string) {
    const today = new Date().toISOString().slice(0, 10);
    const logIndex = state.supplementLogs.findIndex(
      (sl) => sl.clientId === clientId && sl.supplementName === supplementName && sl.date === today
    );

    const updatedLogs = [...state.supplementLogs];
    if (logIndex > -1) {
      updatedLogs[logIndex] = { ...updatedLogs[logIndex], completed: !updatedLogs[logIndex].completed };
    } else {
      updatedLogs.push({
        id: createId("sl"),
        clientId,
        date: today,
        supplementName,
        completed: true
      });
    }

    // Recalculate nutrition compliance
    const clientSupps = updatedLogs.filter((l) => l.clientId === clientId && l.date === today);
    const completedSupps = clientSupps.filter((l) => l.completed).length;
    const nutritionAdherence = clientSupps.length > 0 ? Math.round((completedSupps / clientSupps.length) * 100) : 0;

    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        return { ...c, nutritionCompliance: nutritionAdherence };
      }
      return c;
    });

    state = {
      ...state,
      clients: updatedClients,
      supplementLogs: updatedLogs
    };
    emit();
  },
  setClientStatus(clientId: string, status: "active" | "review" | "inactive") {
    state = {
      ...state,
      clients: state.clients.map((c) => c.id === clientId ? { ...c, status } : c)
    };
    emit();
  },
  resetStore() {
    state = { 
      coach: COACH, 
      clients: [...CLIENTS], 
      panels: [...PANELS], 
      checkIns: [...SEED_CHECKINS], 
      exerciseLogs: SEED_EXERCISE_LOGS(), 
      supplementLogs: SEED_SUPPLEMENT_LOGS(),
      nutritionPlans: SEED_NUTRITION_PLANS(),
      masterExercises: SEED_MASTER_EXERCISES(),
      trainingPlans: SEED_TRAINING_PLANS(),
      supplementProtocols: SEED_SUPPLEMENT_PROTOCOLS(),
      coachNotes: SEED_COACH_NOTES()
    };
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove state from localStorage:", e);
    }
    emit();
  },
  addNutritionPlan(plan) {
    state = { ...state, nutritionPlans: [...state.nutritionPlans, plan] };
    emit();
    return plan;
  },
  updateNutritionPlan(updatedPlan) {
    state = {
      ...state,
      nutritionPlans: state.nutritionPlans.map((p) => p.id === updatedPlan.id ? updatedPlan : p)
    };
    emit();
    return updatedPlan;
  },
  updateTrainingPlan(updatedPlan: TrainingPlan) {
    state = {
      ...state,
      trainingPlans: state.trainingPlans.map((p) => p.id === updatedPlan.id ? updatedPlan : p)
    };
    saveState(state);
    emit();
    return updatedPlan;
  },
  updateSupplementProtocol(updatedProtocol: SupplementProtocol) {
    state = {
      ...state,
      supplementProtocols: state.supplementProtocols.map((p) => p.id === updatedProtocol.id ? updatedProtocol : p)
    };
    saveState(state);
    emit();
    return updatedProtocol;
  },
  addSupplementItem(clientId: string, item: Omit<SupplementProtocolItem, "id">) {
    const newItem: SupplementProtocolItem = {
      ...item,
      id: createId("spi")
    };
    state = {
      ...state,
      supplementProtocols: state.supplementProtocols.map((proto) => {
        if (proto.clientId !== clientId) return proto;
        return {
          ...proto,
          items: [...proto.items, newItem],
          updatedAt: new Date().toISOString()
        };
      })
    };
    saveState(state);
    emit();
    return newItem;
  },
  updateSupplementItem(clientId: string, updatedItem: SupplementProtocolItem) {
    state = {
      ...state,
      supplementProtocols: state.supplementProtocols.map((proto) => {
        if (proto.clientId !== clientId) return proto;
        return {
          ...proto,
          items: proto.items.map((i) => i.id === updatedItem.id ? updatedItem : i),
          updatedAt: new Date().toISOString()
        };
      })
    };
    saveState(state);
    emit();
    return updatedItem;
  },
  pauseSupplementItem(clientId: string, itemId: string) {
    state = {
      ...state,
      supplementProtocols: state.supplementProtocols.map((proto) => {
        if (proto.clientId !== clientId) return proto;
        return {
          ...proto,
          items: proto.items.map((i) => i.id === itemId ? { ...i, status: "paused" as const } : i),
          updatedAt: new Date().toISOString()
        };
      })
    };
    saveState(state);
    emit();
  },
  archiveSupplementItem(clientId: string, itemId: string) {
    state = {
      ...state,
      supplementProtocols: state.supplementProtocols.map((proto) => {
        if (proto.clientId !== clientId) return proto;
        return {
          ...proto,
          items: proto.items.map((i) => i.id === itemId ? { ...i, status: "archived" as const } : i),
          updatedAt: new Date().toISOString()
        };
      })
    };
    saveState(state);
    emit();
  },
  addCoachNote(note: Omit<CoachNote, "id" | "createdAt" | "updatedAt">) {
    const newNote: CoachNote = {
      ...note,
      id: createId("cn"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state = {
      ...state,
      coachNotes: [...state.coachNotes, newNote]
    };
    saveState(state);
    emit();
    return newNote;
  },
  updateCoachNote(updatedNote: CoachNote) {
    const noteWithTimestamp = {
      ...updatedNote,
      updatedAt: new Date().toISOString()
    };
    state = {
      ...state,
      coachNotes: state.coachNotes.map((n) => n.id === updatedNote.id ? noteWithTimestamp : n)
    };
    saveState(state);
    emit();
    return noteWithTimestamp;
  },
  deleteCoachNote(noteId: string) {
    state = {
      ...state,
      coachNotes: state.coachNotes.filter((n) => n.id !== noteId)
    };
    saveState(state);
    emit();
  },
  toggleCoachNotePinned(noteId: string) {
    state = {
      ...state,
      coachNotes: state.coachNotes.map((n) => n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n)
    };
    saveState(state);
    emit();
  },
  acknowledgeCoachNote(noteId: string) {
    state = {
      ...state,
      coachNotes: state.coachNotes.map((n) =>
        n.id === noteId
          ? { ...n, acknowledgedByClient: true, acknowledgedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : n
      )
    };
    saveState(state);
    emit();
  },
  replyToCoachNote(noteId: string, text: string) {
    state = {
      ...state,
      coachNotes: state.coachNotes.map((n) =>
        n.id === noteId ? appendCoachNoteMessage(n, "client", text) : n
      )
    };
    saveState(state);
    emit();
  },
  coachReplyToNote(noteId: string, text: string) {
    state = {
      ...state,
      coachNotes: state.coachNotes.map((n) =>
        n.id === noteId ? appendCoachNoteMessage(n, "coach", text) : n
      )
    };
    saveState(state);
    emit();
  }
};

export function getLatestActiveCoachNote(clientId: string) {
  const clientNotes = state.coachNotes.filter(
    (n) => n.clientId === clientId && n.visibility === "client_safe"
  );
  if (clientNotes.length === 0) return null;
  return clientNotes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}

export function getClient(id: string) {
  return state.clients.find((c) => c.id === id);
}

export function getClientPanels(clientId: string) {
  return state.panels
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getClientCheckIns(clientId: string) {
  return state.checkIns
    .filter((c) => c.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getClientNutritionPlan(clientId: string) {
  return state.nutritionPlans.find((p) => p.clientId === clientId);
}

export function getClientExerciseLogs(clientId: string, date: string) {
  return state.exerciseLogs.filter((l) => l.clientId === clientId && l.date === date);
}

export function getClientSupplementLogs(clientId: string, date: string) {
  return state.supplementLogs.filter((l) => l.clientId === clientId && l.date === date);
}

export function getClientTrainingPlan(clientId: string) {
  return state.trainingPlans.find((p) => p.clientId === clientId);
}

export function getMasterExercises() {
  return state.masterExercises;
}

export function getClientSupplementProtocol(clientId: string) {
  return state.supplementProtocols.find((p) => p.clientId === clientId);
}

export function getClientCoachNotes(clientId: string) {
  return state.coachNotes.filter((n) => n.clientId === clientId);
}

export function getWeekKey(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export function getCheckInsForClient(clientId: string): CheckIn[] {
  return state.checkIns
    .filter((c) => c.clientId === clientId)
    .map((c) => ({
      ...c,
      weekKey: c.weekKey || getWeekKey(c.date),
      status: c.status || "reviewed",
      submittedAt: c.submittedAt || new Date(c.date).toISOString()
    }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getLatestCheckInForClient(clientId: string): CheckIn | null {
  const list = getCheckInsForClient(clientId);
  return list.length > 0 ? list[0] : null;
}

export function getCurrentWeekCheckIn(clientId: string): CheckIn | null {
  const currentWeek = getWeekKey();
  const list = getCheckInsForClient(clientId);
  return list.find((c) => c.weekKey === currentWeek) || null;
}

export function deriveNeedsReviewClients(): typeof state.clients {
  return state.clients.filter((c) => {
    if (c.status === "review") return true;
    const clientCheckIns = state.checkIns.filter((ch) => ch.clientId === c.id);
    return clientCheckIns.some((ch) => ch.status === "needs_review" || ch.status === "submitted");
  });
}
