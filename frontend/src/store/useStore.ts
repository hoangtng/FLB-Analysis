import { create } from 'zustand';
import type { AppMode, DelayFilters, UploadRecord } from '../types/';

interface AppStore {
  mode: AppMode;
  setMode: (m: AppMode) => void;

  activeUploadId: string | null;
  setActiveUploadId: (id: string | null) => void;

  uploads: UploadRecord[];
  setUploads: (u: UploadRecord[]) => void;

  filters: DelayFilters;
  setFilter: (key: keyof DelayFilters, value: string) => void;
  resetFilters: () => void;

  drillCode: string | null;
  setDrillCode: (code: string | null) => void;

  alertModal: { open: boolean; team: string; context: string };
  openAlert: (team: string, context: string) => void;
  closeAlert: () => void;

  toast: { message: string; type: 'success' | 'error'; visible: boolean };
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const defaultFilters: DelayFilters = { origin: '', cat: '', chargeable: '', search: '' };

export const useStore = create<AppStore>((set) => ({
  mode: 'ops',
  setMode: (mode) => set({ mode }),

  activeUploadId: null,
  setActiveUploadId: (id) => set({ activeUploadId: id }),

  uploads: [],
  setUploads: (uploads) => set({ uploads }),

  filters: defaultFilters,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),

  drillCode: null,
  setDrillCode: (code) => set({ drillCode: code }),

  alertModal: { open: false, team: '', context: '' },
  openAlert: (team, context) => set({ alertModal: { open: true, team, context } }),
  closeAlert: () => set({ alertModal: { open: false, team: '', context: '' } }),

  toast: { message: '', type: 'success', visible: false },
  showToast: (message, type = 'success') => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => set((s) => ({ toast: { ...s.toast, visible: false } })), 3000);
  },
}));
