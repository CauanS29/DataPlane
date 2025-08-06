import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAppStore } from '@/store';
import { apiClient } from '@/lib/api';
import { PredictionRequest, PredictionResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Brain, Send, AlertCircle, BarChart2, Zap } from 'lucide-react';
import { Select } from 'antd';
import toast from 'react-hot-toast';
import axios from 'axios';

interface FilterOptionsResponse {
  filter_options: {
    states: string[];
    cities: string[];
    classifications: string[];
    countries: string[];
    aerodromes: string[];
    aircraft_manufacturers: string[];
    aircraft_types: string[];
    aircraft_models: string[];
    damage_levels: string[];
    aircraft_operators: string[];
    operation_phases: string[];
    operation_types: string[];
    investigation_status: string[];
    aircraft_released: string[];
    occurrence_types: string[];
    occurrence_type_categories: string[];
    factor_names: string[];
    factor_aspects: string[];
    factor_areas: string[];
  };
  metadata: {
    total_unique_options: number;
    fields_available: number;
    data_source: string;
    note: string;
  };
}

const PredictionPage: React.FC = () => {
  const { testApiConnection } = useAppStore();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);

  // Função auxiliar para converter array de strings em opções do Select
  const arrayToSelectOptions = (options: string[]) => {
    return options.map(option => ({
      label: option,
      value: option
    }));
  };

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
      
        try {
          const options = await apiClient.getFilterOptions();
          setFilterOptions(options);
        } catch (error) {
          console.error('Erro ao buscar opções do formulário:', error);
          toast.error('Erro ao buscar opções do formulário.');
        
      }
    };
    fetchOptions();
  }, []);

  const onSubmit = async (data: PredictionRequest) => {

    
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
                  <label className="block text-sm font-medium text-black mb-2">Tipo de Operação</label>
                  <Select
                    {...field}
                    showSearch
                    placeholder="Selecione tipo de operação"
                    options={filterOptions ? arrayToSelectOptions(filterOptions.filter_options.operation_types) : []}
                    className="w-full"
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    status={errors.aeronave_tipo_operacao ? 'error' : undefined}
                  />
                  {errors.aeronave_tipo_operacao && <span className="text-red-500 text-sm mt-1">{errors.aeronave_tipo_operacao.message}</span>}
                </div>
              )}
            />

            <Controller
              name="fator_area"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-black mb-2">Área do Fator Contribuinte</label>
                  <Select
                    {...field}
                    showSearch
                    placeholder="Selecione área do fator contribuinte"
                    options={filterOptions ? arrayToSelectOptions(filterOptions.filter_options.factor_areas) : []}
                    className="w-full"
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    status={errors.fator_area ? 'error' : undefined}
                  />
                  {errors.fator_area && <span className="text-red-500 text-sm mt-1">{errors.fator_area.message}</span>}
                </div>
              )}
            />

            <Controller
              name="aeronave_tipo_veiculo"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-black mb-2">Tipo de Veículo</label>
                  <Select
                    {...field}
                    showSearch
                    placeholder="Selecione tipo de veículo"
                    options={filterOptions ? arrayToSelectOptions(filterOptions.filter_options.aircraft_types) : []}
                    className="w-full"
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    status={errors.aeronave_tipo_veiculo ? 'error' : undefined}
                  />
                  {errors.aeronave_tipo_veiculo && <span className="text-red-500 text-sm mt-1">{errors.aeronave_tipo_veiculo.message}</span>}
                </div>
              )}
            />

            <Controller
              name="ocorrencia_uf"
              control={control}
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-black mb-2">UF da Ocorrência</label>
                  <Select
                    {...field}
                    showSearch
                    placeholder="Selecione UF da ocorrência"
                    options={filterOptions ? arrayToSelectOptions(filterOptions.filter_options.states) : []}
                    className="w-full"
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    status={errors.ocorrencia_uf ? 'error' : undefined}
                  />
                  {errors.ocorrencia_uf && <span className="text-red-500 text-sm mt-1">{errors.ocorrencia_uf.message}</span>}
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
              disabled={!filterOptions}
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