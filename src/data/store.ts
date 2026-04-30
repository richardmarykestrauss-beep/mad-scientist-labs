import { useSyncExternalStore } from "react";
import type { BloodPanel, BiomarkerResult } from "@/lib/types";
import { CLIENTS, PANELS, COACH } from "./mock";

type State = {
  coach: typeof COACH;
  clients: typeof CLIENTS;
  panels: BloodPanel[];
};

let state: State = { coach: COACH, clients: [...CLIENTS], panels: [...PANELS] };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
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
};

export function getClient(id: string) {
  return state.clients.find((c) => c.id === id);
}
export function getClientPanels(clientId: string) {
  return state.panels
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => a.date.localeCompare(b.date));
}
