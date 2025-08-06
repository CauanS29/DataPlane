import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAppStore } from '@/store';
import { apiClient } from '@/lib/api';
import { PredictionRequest, PredictionResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Brain, Send, AlertCircle, BarChart2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface FormOptions {
  aeronave_tipo_operacao: string[];
  fator_area: string[];
  aeronave_tipo_veiculo: string[];
  ocorrencia_uf: string[];
}

const PredictionPage: React.FC = () => {
  const { isAuthenticated, testApiConnection } = useAppStore();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PredictionRequest>({
    defaultValues: {
      aeronave_tipo_operacao: '',
      fator_area: '',
      aeronave_tipo_veiculo: '',
      ocorrencia_uf: '',
      aeronave_ano_fabricacao: new Date().getFullYear(),
      aeronave_fatalidades_total: 0,
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      if (isAuthenticated) {
        try {
          const options = await apiClient.getPredictionFormOptions();
          setFormOptions(options as any);
        } catch (error) {
          toast.error('Erro ao buscar opções do formulário.');
        }
      }
    };
    fetchOptions();
  }, [isAuthenticated]);

  const onSubmit = async (data: PredictionRequest) => {
    if (!isAuthenticated) {
      toast.error('API não está conectada. Verifique a configuração.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Garante que os valores numéricos sejam enviados como números
      const requestData: PredictionRequest = {
        ...data,
        aeronave_ano_fabricacao: Number(data.aeronave_ano_fabricacao),
        aeronave_fatalidades_total: Number(data.aeronave_fatalidades_total),
      };

      const response = await apiClient.predictDamage(requestData);
      setResult(response);
      toast.success('Predição gerada com sucesso!');
    } catch (error) {
      console.error('Erro na predição:', error);
      let errorMessage = 'Erro ao gerar predição.';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'Erro de autenticação. Verifique a configuração da API.';
            testApiConnection();
          } else if (error.response.status === 422) {
            errorMessage = 'Dados inválidos. Verifique os parâmetros.';
          } else if (error.response.data?.detail) {
            errorMessage = `Erro do servidor: ${error.response.data.detail}`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.75) return 'text-green-600';
    if (confidence > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDamageColor = (damage: string) => {
    switch(damage.toUpperCase()) {
      case 'DESTRUÍDA': return 'bg-red-100 text-red-800';
      case 'SUBSTANCIAL': return 'bg-yellow-100 text-yellow-800';
      case 'LEVE': return 'bg-blue-100 text-blue-800';
      case 'NENHUM': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Previsão de Nível de Dano</h2>
        <p className="text-gray-600">
          Preencha os dados da ocorrência para prever o nível de dano da aeronave.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">API Desconectada</h3>
              <p className="text-sm text-red-700 mt-1">
                A API não está conectada. Verifique se a API está rodando e se o token está configurado corretamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Parâmetros da Ocorrência
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="aeronave_tipo_operacao"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Operação</label>
                  <select {...field} className={`border ${errors.aeronave_tipo_operacao ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}>
                    <option value="">Selecione...</option>
                    {formOptions?.aeronave_tipo_operacao.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.aeronave_tipo_operacao && <span className="text-red-500 text-sm">{errors.aeronave_tipo_operacao.message}</span>}
                </div>
              )}
            />

            <Controller
              name="fator_area"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Área do Fator Contribuinte</label>
                  <select {...field} className={`border ${errors.fator_area ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}>
                    <option value="">Selecione...</option>
                    {formOptions?.fator_area.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.fator_area && <span className="text-red-500 text-sm">{errors.fator_area.message}</span>}
                </div>
              )}
            />

            <Controller
              name="aeronave_tipo_veiculo"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Veículo</label>
                  <select {...field} className={`border ${errors.aeronave_tipo_veiculo ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}>
                    <option value="">Selecione...</option>
                    {formOptions?.aeronave_tipo_veiculo.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.aeronave_tipo_veiculo && <span className="text-red-500 text-sm">{errors.aeronave_tipo_veiculo.message}</span>}
                </div>
              )}
            />

            <Controller
              name="ocorrencia_uf"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">UF da Ocorrência</label>
                  <select {...field} className={`border ${errors.ocorrencia_uf ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}>
                    <option value="">Selecione...</option>
                    {formOptions?.ocorrencia_uf.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {errors.ocorrencia_uf && <span className="text-red-500 text-sm">{errors.ocorrencia_uf.message}</span>}
            </div>
              )}
            />

            <Controller
              name="aeronave_ano_fabricacao"
              control={control}
              rules={{ required: 'Campo obrigatório', min: 1900, max: new Date().getFullYear() }}
              render={({ field }) => (
              <Input
                  {...field}
                  label="Ano de Fabricação"
                type="number"
                  placeholder="Ex: 2010"
                  error={errors.aeronave_ano_fabricacao?.message}
                />
              )}
            />

            <Controller
              name="aeronave_fatalidades_total"
              control={control}
              rules={{ required: 'Campo obrigatório', min: 0 }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Total de Fatalidades"
                  type="number"
                  placeholder="Ex: 0"
                  error={errors.aeronave_fatalidades_total?.message}
                />
              )}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={!isAuthenticated || !formOptions}
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Analisando...' : 'Gerar Predição'}
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2" />
            Resultado da Predição
          </h3>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Gerando predição...</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 text-center">
                <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Nível de Dano Previsto</p>
                    <p className={`text-2xl font-bold px-3 py-1 rounded-md inline-block ${getDamageColor(result.prediction)}`}>
                        {result.prediction}
                    </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Confiança da Predição</p>
                    <p className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                        {(result.confidence * 100).toFixed(2)}%
                    </p>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>O resultado da predição aparecerá aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage; 