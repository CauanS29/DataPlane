import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '@/store';
import { apiClient } from '@/lib/api';
import { AIRequest, AIResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Brain, Send, Copy, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface PredictionFormData {
  prompt: string;
  maxLength: number;
  temperature: number;
  topP: number;
  doSample: boolean;
}

const PredictionPage: React.FC = () => {
  const { isAuthenticated, testApiConnection } = useAppStore();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PredictionFormData>({
    defaultValues: {
      prompt: '',
      maxLength: 100,
      temperature: 0.7,
      topP: 0.9,
      doSample: true,
    },
  });

  const onSubmit = async (data: PredictionFormData) => {
    if (!isAuthenticated) {
      toast.error('API não está conectada. Verifique a configuração.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const request: AIRequest = {
        prompt: data.prompt,
        max_length: data.maxLength,
        temperature: data.temperature,
        top_p: data.topP,
        do_sample: data.doSample,
      };

      const response = await apiClient.generateText(request);
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
            errorMessage = error.response.data.detail;
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

  const copyToClipboard = () => {
    if (result?.generated_text) {
      navigator.clipboard.writeText(result.generated_text);
      toast.success('Texto copiado para a área de transferência!');
    }
  };

  const downloadResult = () => {
    if (result) {
      const blob = new Blob([result.generated_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Resultado baixado!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Predição com IA</h2>
        <p className="text-gray-600">
          Use inteligência artificial para gerar texto baseado no seu prompt.
        </p>
      </div>

      {/* Alerta de conectividade */}
      {!isAuthenticated && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                API Desconectada
              </h3>
              <p className="text-sm text-red-700 mt-1">
                A API não está conectada. Verifique se a API está rodando e se o token está configurado corretamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Configurações da Predição
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Textarea
              label="Prompt"
              placeholder="Digite o texto que você quer que a IA continue ou analise..."
              {...register('prompt', { required: 'Prompt é obrigatório' })}
              error={errors.prompt?.message}
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Comprimento Máximo"
                type="number"
                min={1}
                max={1000}
                {...register('maxLength', {
                  required: 'Comprimento é obrigatório',
                  min: { value: 1, message: 'Mínimo 1' },
                  max: { value: 1000, message: 'Máximo 1000' },
                })}
                error={errors.maxLength?.message}
              />

              <Input
                label="Temperatura"
                type="number"
                step="0.1"
                min="0"
                max="2"
                {...register('temperature', {
                  required: 'Temperatura é obrigatória',
                  min: { value: 0, message: 'Mínimo 0' },
                  max: { value: 2, message: 'Máximo 2' },
                })}
                error={errors.temperature?.message}
                helperText="Controla a criatividade (0-2)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Top P"
                type="number"
                step="0.1"
                min="0"
                max="1"
                {...register('topP', {
                  required: 'Top P é obrigatório',
                  min: { value: 0, message: 'Mínimo 0' },
                  max: { value: 1, message: 'Máximo 1' },
                })}
                error={errors.topP?.message}
                helperText="Controla a diversidade (0-1)"
              />

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="doSample"
                  {...register('doSample')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="doSample" className="text-sm text-gray-700">
                  Amostragem
                </label>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={!isAuthenticated}
            >
              <Send className="w-4 h-4 mr-2" />
              {!isAuthenticated ? 'API não conectada' : 'Gerar Predição'}
            </Button>
          </form>
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado</h3>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Gerando predição...</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Texto Gerado:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{result.generated_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Modelo:</span>
                  <p className="text-gray-600">{result.model_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tempo:</span>
                  <p className="text-gray-600">{result.generation_time.toFixed(2)}s</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tokens:</span>
                  <p className="text-gray-600">{result.tokens_generated}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Prompt:</span>
                  <p className="text-gray-600 truncate">{result.prompt}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResult}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Configure os parâmetros e gere uma predição</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage; 