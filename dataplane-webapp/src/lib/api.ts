import axios, { AxiosInstance } from 'axios';
import { AIRequest, AIResponse, HealthCheck } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private apiToken: string;

  constructor() {
    // Obtém o token da variável de ambiente
    this.apiToken = process.env.NEXT_PUBLIC_API_TOKEN || '';
    
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
    });

    // Interceptor para adicionar token de autenticação
    this.client.interceptors.request.use((config) => {
      if (this.apiToken) {
        config.headers.Authorization = `Bearer ${this.apiToken}`;
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token inválido ou expirado
          console.error('Erro de autenticação:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async getHealth(): Promise<HealthCheck> {
    const response = await this.client.get('/api/v1/health');
    return response.data;
  }

  // AI Prediction
  async generateText(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.post('/api/v1/ai/generate', request);
    return response.data;
  }

  // AI Model Info
  async getModelInfo() {
    const response = await this.client.get('/api/v1/ai/model/info');
    return response.data;
  }

  // Load AI Model
  async loadModel() {
    const response = await this.client.post('/api/v1/ai/model/load');
    return response.data;
  }

  // Unload AI Model
  async unloadModel() {
    const response = await this.client.post('/api/v1/ai/model/unload');
    return response.data;
  }

  // Get AI History
  async getAIHistory(limit = 50, skip = 0) {
    const response = await this.client.get(`/api/v1/ai/history?limit=${limit}&skip=${skip}`);
    return response.data;
  }

  async getOcurrencesCoordinates() {
    const response = await this.client.get('/api/v1/ocurrence/coordinates?complete=true');
    return response.data;
  }

  async getFilterOptions() {
    const response = await this.client.get('/api/v1/ocurrence/filter-options');
    return response.data;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('Erro ao conectar com a API:', error);
      return false;
    }
  }

  // Test connection with authentication
  async testConnectionWithAuth(): Promise<boolean> {
    try {
      if (!this.apiToken) {
        console.warn('API Token não configurado na variável de ambiente');
        return false;
      }
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('Erro ao conectar com a API autenticada:', error);
      return false;
    }
  }

  // Verifica se o token está configurado
  isTokenConfigured(): boolean {
    return !!this.apiToken;
  }
}

// Instância singleton do cliente da API
export const apiClient = new ApiClient(); 