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
  clearStorageData: () => void;
  // Filtros do mapa
  filters: Record<string, string | string[]>;
  setFilter: (filterId: string, value: string | string[]) => void;
  clearFilters: () => void;
}

const initialState: AppState = {
  currentView: 'prediction',
  apiToken: '', // Não é mais usado, mas mantido para compatibilidade
  isAuthenticated: false,
  accidents: [],
  ocurrences: [],
  ocurrencesTotal: 0,
  loading: false,
  error: null,
  filters: {},
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Funções de filtro
      filters: {},
      setFilter: (filterId: string, value: string | string[]) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterId]: value
          }
        })),
      clearFilters: () => set((state) => ({ filters: {} })),

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
        } catch {
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
          // Garante que data seja um objeto com total e ocurrences
          const ocurrencesArray = Array.isArray(data.ocurrences) ? data.ocurrences : [];
          const total = data.total || 0;
          
          // Log do tamanho dos dados para monitoramento
          console.log(`Dados recebidos: ${ocurrencesArray.length} ocorrências, ~${JSON.stringify(ocurrencesArray).length} bytes`);
          
          set({ ocurrences: ocurrencesArray, ocurrencesTotal: total, loading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar coordenadas';
          set({ error: errorMessage, loading: false, ocurrences: [], ocurrencesTotal: 0 });
          console.error('Erro ao buscar coordenadas:', err);
        }
      },

      // Função para limpar dados do localStorage em caso de problemas
      clearStorageData: () => {
        try {
          localStorage.removeItem('dataplane-storage');
          console.log('Dados do localStorage limpos com sucesso');
        } catch (clearError) {
          console.warn('Erro ao limpar localStorage:', clearError);
        }
      },
    }),
    
    {
      name: 'dataplane-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        isAuthenticated: state.isAuthenticated,
        // Apenas dados pequenos e essenciais são persistidos
        // accidents, ocurrences e outros dados grandes são sempre rebuscados
      }),
      // Tratamento de erros no próprio persist
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Erro ao recarregar dados do localStorage:', error);
            // Em caso de erro, limpa os dados
            try {
              localStorage.removeItem('dataplane-storage');
            } catch (clearError) {
              console.warn('Erro ao limpar localStorage:', clearError);
            }
          }
        };
      },
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