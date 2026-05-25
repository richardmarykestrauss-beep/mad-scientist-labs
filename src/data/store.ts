import { useSyncExternalStore } from "react";
import type { BloodPanel, BiomarkerResult, CheckIn, ExerciseLog, SupplementLog } from "@/lib/types";
import { CLIENTS, PANELS, COACH } from "./mock";

type State = {
  coach: typeof COACH;
  clients: typeof CLIENTS;
  panels: BloodPanel[];
  checkIns: CheckIn[];
  exerciseLogs: ExerciseLog[];
  supplementLogs: SupplementLog[];
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

const loadInitialState = (): State => {
  const defaultState: State = { 
    coach: COACH, 
    clients: [...CLIENTS], 
    panels: [...PANELS],
    checkIns: [...SEED_CHECKINS],
    exerciseLogs: SEED_EXERCISE_LOGS(),
    supplementLogs: SEED_SUPPLEMENT_LOGS()
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
          supplementLogs: parsed.supplementLogs || SEED_SUPPLEMENT_LOGS()
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
      supplementLogs: newState.supplementLogs
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

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const actions = {
  addPanel(clientId: string, date: string, label: string, results: BiomarkerResult[], summary?: string) {
    const panel: BloodPanel = { id: `p-${Date.now()}`, clientId, date, label, results, coachSummary: summary };
    state = { ...state, panels: [...state.panels, panel] };
    emit();
    return panel;
  },
  addClient(name: string, email: string, goal: string) {
    const id = `c-${Date.now()}`;
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
    const today = new Date().toISOString().slice(0, 10);
    const newCheckIn: CheckIn = {
      id: `ch-${Date.now()}`,
      clientId,
      date: today,
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
        id: `el-${Date.now()}`,
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
        id: `sl-${Date.now()}`,
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
  resetStore() {
    state = { 
      coach: COACH, 
      clients: [...CLIENTS], 
      panels: [...PANELS],
      checkIns: [...SEED_CHECKINS],
      exerciseLogs: SEED_EXERCISE_LOGS(),
      supplementLogs: SEED_SUPPLEMENT_LOGS()
    };
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove state from localStorage:", e);
    }
    emit();
  }
};

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

export function getClientExerciseLogs(clientId: string, date: string) {
  return state.exerciseLogs.filter((l) => l.clientId === clientId && l.date === date);
}

export function getClientSupplementLogs(clientId: string, date: string) {
  return state.supplementLogs.filter((l) => l.clientId === clientId && l.date === date);
}
