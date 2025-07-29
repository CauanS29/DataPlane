import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AirAccident, DashboardFilters, OcurrenceCoordinates } from '@/types';
import { apiClient } from '@/lib/api';

interface AppStore extends AppState {
  // Actions
  setCurrentView: (view: 'prediction' | 'dashboard') => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAccidents: (accidents: AirAccident[]) => void;
  setOcurrences: (ocurrences: OcurrenceCoordinates[]) => void;
  setLoading: (loading: boolean) => void;
  addAccident: (accident: AirAccident) => void;
  updateAccident: (id: string, updates: Partial<AirAccident>) => void;
  removeAccident: (id: string) => void;
  reset: () => void;
  testApiConnection: () => Promise<boolean>;
  fetchAccidents: () => Promise<void>;
  fetchOcurrencesCoordinates: () => Promise<void>;
}

const initialState: AppState = {
  currentView: 'prediction',
  apiToken: '', // Não é mais usado, mas mantido para compatibilidade
  isAuthenticated: false,
  accidents: [],
  ocurrences: [],
  loading: false,
  error: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentView: (view) => set({ currentView: view }),

      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

      setAccidents: (accidents) => set({ accidents }),

      setOcurrences: (ocurrences) => set({ ocurrences }),

      setLoading: (loading) => set({ loading }),

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

      fetchAccidents: async () => {
        set({ loading: true, error: null });
        try {
          const data = await apiClient.getAIHistory();
          set({ accidents: data, loading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados';
          set({ error: errorMessage, loading: false });
          console.error('Erro ao buscar dados:', err);
        }
      },

      fetchOcurrencesCoordinates: async () => {
        set({ loading: true, error: null });
        try {
          const data = await apiClient.getOcurrencesCoordinates();
          set({ ocurrences: data, loading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar coordenadas';
          set({ error: errorMessage, loading: false });
          console.error('Erro ao buscar coordenadas:', err);
        }
      },
    }),
    
    {
      name: 'dataplane-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        isAuthenticated: state.isAuthenticated,
        accidents: state.accidents,
        ocurrences: state.ocurrences,
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