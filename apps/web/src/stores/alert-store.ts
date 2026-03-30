import { create } from 'zustand';

export interface Alert {
  id: string;
  symbol: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  acknowledged: boolean;
}

interface AlertState {
  alerts: Alert[];
  unacknowledgedCount: number;

  addAlert: (alert: Omit<Alert, 'id' | 'acknowledged'>) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAll: () => void;
}

function countUnacknowledged(alerts: Alert[]): number {
  return alerts.filter((a) => !a.acknowledged).length;
}

export const useAlertStore = create<AlertState>()((set) => ({
  alerts: [],
  unacknowledgedCount: 0,

  addAlert: (alert) =>
    set((state) => {
      const newAlert: Alert = {
        ...alert,
        id: crypto.randomUUID(),
        acknowledged: false,
      };
      const next = [newAlert, ...state.alerts];
      return { alerts: next, unacknowledgedCount: countUnacknowledged(next) };
    }),

  removeAlert: (id: string) =>
    set((state) => {
      const next = state.alerts.filter((a) => a.id !== id);
      return { alerts: next, unacknowledgedCount: countUnacknowledged(next) };
    }),

  acknowledgeAlert: (id: string) =>
    set((state) => {
      const next = state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      );
      return { alerts: next, unacknowledgedCount: countUnacknowledged(next) };
    }),

  clearAll: () => set({ alerts: [], unacknowledgedCount: 0 }),
}));
