import { useSyncExternalStore } from "react";
import type { BloodPanel, BiomarkerResult } from "@/lib/types";
import { CLIENTS, PANELS, COACH } from "./mock";

type State = {
  coach: typeof COACH;
  clients: typeof CLIENTS;
  panels: BloodPanel[];
};

const LOCAL_STORAGE_KEY = "mad-scientist-lab-state";

const loadInitialState = (): State => {
  const defaultState: State = { coach: COACH, clients: [...CLIENTS], panels: [...PANELS] };
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.clients && parsed.panels) {
        return {
          coach: COACH,
          clients: parsed.clients,
          panels: parsed.panels
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
      panels: newState.panels
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
  resetStore() {
    state = { coach: COACH, clients: [...CLIENTS], panels: [...PANELS] };
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
