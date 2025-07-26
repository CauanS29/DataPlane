// Tipos para a API
export interface AIRequest {
  prompt: string;
  max_length?: number;
  temperature?: number;
  top_p?: number;
  do_sample?: boolean;
}

export interface AIResponse {
  generated_text: string;
  prompt: string;
  model_name: string;
  generation_time: number;
  tokens_generated: number;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
}

// Tipos para acidentes aéreos
export interface AirAccident {
  id: string;
  date: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  aircraft: {
    type: string;
    registration: string;
    operator: string;
  };
  fatalities: {
    total: number;
    passengers: number;
    crew: number;
    ground: number;
  };
  phase: string; // takeoff, landing, cruise, etc.
  cause: string;
  weather: string;
  severity: 'minor' | 'major' | 'fatal';
}

// Tipos para o estado da aplicação
export interface AppState {
  currentView: 'prediction' | 'dashboard';
  apiToken: string;
  isAuthenticated: boolean;
  accidents: AirAccident[];
  loading: boolean;
  error: string | null;
}

// Tipos para formulários
export interface PredictionFormData {
  prompt: string;
  maxLength: number;
  temperature: number;
  topP: number;
  doSample: boolean;
}

// Tipos para filtros do dashboard
export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  severity: string[];
  phase: string[];
  country: string[];
} 