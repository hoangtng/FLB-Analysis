import { create } from 'zustand';
import type { AppMode, DelayFilters, UploadRecord } from '../types/';

interface AppStore {
  mode: AppMode;
  setMode: (m: AppMode) => void;

  activeUploadId: string | null;
  setActiveUploadId: (id: string | null) => void;

  uploads: UploadRecord[];
  setUploads: (u: UploadRecord[]) => void;
  
  page: number;
  setPage: (page: number) => void;

  filters: DelayFilters;
  setFilter:      (key: keyof DelayFilters, value: string) => void;
  setMonthFilter: (month: string) => void;   // ← NEW: sets month + clears week
  setWeekFilter:  (week: string)  => void;   // ← NEW: sets week
  setQuickRange:  (from: string, to: string) => void; // ← NEW: sets custom range
  resetFilters:   () => void;


  drillCode: string | null;
  setDrillCode: (code: string | null) => void;

  alertModal: { open: boolean; team: string; context: string };
  openAlert: (team: string, context: string) => void;
  closeAlert: () => void;

  toast: { message: string; type: 'success' | 'error'; visible: boolean };
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const defaultFilters: DelayFilters = {
  origin:     '',
  cat:        '',
  chargeable: '',
  search:     '',
  from:       '',
  to:         '',
  month:      '',
  week:       '',
};


export const useStore = create<AppStore>((set) => ({
  mode: 'ops',
  setMode: (mode) => set({ mode }),

  activeUploadId: null,
  setActiveUploadId: (id) => set({ activeUploadId: id }),

  uploads: [],
  setUploads: (uploads) => set({ uploads }),

  page:    1,
      setPage: (page) => set({ page }),

   filters: defaultFilters,

  // Generic single-field update
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  // Set month — atomically clears week + custom range in same update
  setMonthFilter: (month) =>
    set((s) => ({
      filters: {
        ...s.filters,
        month,
        week: '',   // clear week when month changes
        from: '',   // clear custom range when month is selected
        to:   '',
      },
    })),

  // Set week — only valid within a selected month
  setWeekFilter: (week) =>
    set((s) => ({
      filters: { ...s.filters, week },
    })),

  // Set a custom date range — clears month + week
  setQuickRange: (from, to) =>
    set((s) => ({
      filters: {
        ...s.filters,
        from,
        to,
        month: '',  // clear month when custom range is selected
        week:  '',
      },
    })),

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
