import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AirAccident, DashboardFilters } from '@/types';
import { apiClient } from '@/lib/api';

interface AppStore extends AppState {
  // Actions
  setCurrentView: (view: 'prediction' | 'dashboard') => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAccidents: (accidents: AirAccident[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addAccident: (accident: AirAccident) => void;
  updateAccident: (id: string, updates: Partial<AirAccident>) => void;
  removeAccident: (id: string) => void;
  clearError: () => void;
  reset: () => void;
  testApiConnection: () => Promise<boolean>;
}

const initialState: AppState = {
  currentView: 'prediction',
  apiToken: '', // Não é mais usado, mas mantido para compatibilidade
  isAuthenticated: false,
  accidents: [],
  loading: false,
  error: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentView: (view) => set({ currentView: view }),

      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

      setAccidents: (accidents) => set({ accidents }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      addAccident: (accident) =>
        set((state) => ({
          accidents: [...state.accidents, accident],
        })),

      updateAccident: (id, updates) =>
        set((state) => ({
          accidents: state.accidents.map((accident) =>
            accident.id === id ? { ...accident, ...updates } : accident
          ),
        })),

      removeAccident: (id) =>
        set((state) => ({
          accidents: state.accidents.filter((accident) => accident.id !== id),
        })),

      clearError: () => set({ error: null }),

      reset: () => {
        set(initialState);
      },

      testApiConnection: async () => {
        try {
          const isConnected = await apiClient.testConnectionWithAuth();
          set({ isAuthenticated: isConnected });
          return isConnected;
        } catch (error) {
          set({ isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'dataplane-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        isAuthenticated: state.isAuthenticated,
        accidents: state.accidents,
      }),
    }
  )
);

// Store para filtros do dashboard
interface DashboardStore {
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
}

const initialFilters: DashboardFilters = {
  dateRange: {
    start: '',
    end: '',
  },
  severity: [],
  phase: [],
  country: [],
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      filters: initialFilters,

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: initialFilters }),
    }),
    {
      name: 'dashboard-filters',
    }
  )
); 