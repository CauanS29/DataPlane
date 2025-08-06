// Tipos para a API
export interface PredictionRequest {
  aeronave_tipo_operacao: string;
  fator_area: string;
  aeronave_tipo_veiculo: string;
  aeronave_ano_fabricacao: number;
  ocorrencia_uf: string;
  aeronave_fatalidades_total: number;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
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
  ocurrences: OcurrenceCoordinates[];
  ocurrencesTotal: number;
  loading: boolean;
  error: string | null;
  filters: Record<string, string | string[]>;
}

// Tipos para formulários

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

export interface OcurrenceCoordinates {
  codigo_ocorrencia: string;
  ocorrencia_classificacao: string;
  ocorrencia_latitude: number;
  ocorrencia_longitude: number;
  ocorrencia_cidade: string;
  ocorrencia_uf: string;
  ocorrencia_pais: string;
  ocorrencia_aerodromo: string;
  ocorrencia_dia: string;
  ocorrencia_hora: string;
  investigacao_aeronave_liberada: string;
  investigacao_status: string;
  divulgacao_relatorio_numero: string;
  divulgacao_relatorio_publicado: string;
  divulgacao_dia_publicacao: string | null;
  total_recomendacoes: number;
  total_aeronaves_envolvidas: number;
  ocorrencia_saida_pista: string;
  aeronave_matricula: string;
  aeronave_operador_categoria: string;
  aeronave_tipo_veiculo: string;
  aeronave_fabricante: string;
  aeronave_modelo: string;
  aeronave_tipo_icao: string;
  aeronave_motor_tipo: string;
  aeronave_motor_quantidade: string;
  aeronave_pmd: number;
  aeronave_pmd_categoria: number;
  aeronave_assentos: number;
  aeronave_ano_fabricacao: number;
  aeronave_pais_fabricante: string;
  aeronave_pais_registro: string;
  aeronave_registro_categoria: string;
  aeronave_registro_segmento: string;
  aeronave_voo_origem: string;
  aeronave_voo_destino: string;
  aeronave_fase_operacao: string;
  aeronave_tipo_operacao: string;
  aeronave_nivel_dano: string;
  aeronave_fatalidades_total: number;
  ocorrencia_tipo: string;
  ocorrencia_tipo_categoria: string;
  taxonomia_tipo_icao: string;
  fator_nome: string | null;
  fator_aspecto: string | null;
  fator_condicionante: string | null;
  fator_area: string | null;
  recomendacao_numero: string | null;
  recomendacao_conteudo: string | null;
  recomendacao_status: string | null;
  recomendacao_destinatario: string | null;
}

export interface OcurrencesResponse {
  total: number;
  ocurrences: OcurrenceCoordinates[];
}