import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Filter as FilterIcon } from 'lucide-react';
import { Select } from 'antd';
import TemporalCharts from './TemporalCharts';
import Filter from './Filter';

const ChartsPage: React.FC = () => {
  const { ocurrences, filters, segmentBy, fetchOcurrencesCoordinates } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Carregando dados para ChartsPage...');
    fetchOcurrencesCoordinates();
  }, [fetchOcurrencesCoordinates]);

  // Calcula filtros ativos
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      return value.trim() !== '';
    }).length;
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise Temporal</h2>
          <p className="text-gray-600">
            Visualize tendências e padrões temporais dos incidentes aéreos.
          </p>
        </div>
      </div>

      {/* Gráficos Temporais */}
      <div className="mb-8">
        <TemporalCharts 
          ocurrences={ocurrences} 
          segmentBy={segmentBy}
          filters={filters}
        />
      </div>

      {/* Botão Flutuante Redondo - Canto Inferior Esquerdo */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
        aria-label="Filtros"
      >
        <FilterIcon className="w-6 h-6" />
        
        {/* Badge de filtros ativos */}
        {activeFiltersCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {activeFiltersCount}
          </span>
        )}
        
        {/* Tooltip */}
        <span className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {showFilters ? 'Fechar Filtros' : 'Abrir Filtros'}
        </span>
      </button>

      {/* Overlay invisível para detectar cliques fora do painel */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Painel Vertical de Filtros - Lateral Esquerda */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full overflow-y-auto">
          {/* Header do painel */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FilterIcon className="w-5 h-5 mr-2" />
                Filtros Avançados
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Select de Segmentação */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Segmentação do Gráfico</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segmentar dados por:
                </label>
                <Select
                  value={segmentBy || ""}
                  onChange={(value) => {
                    const { setSegmentBy } = useAppStore.getState();
                    setSegmentBy(value);
                  }}
                  placeholder="Selecione a segmentação"
                  className="w-full"
                  size="middle"
                >
                  <Select.Option value="">Sem segmentação</Select.Option>
                  <Select.Option value="ocorrencia_classificacao">Por Classificação</Select.Option>
                  <Select.Option value="aeronave_tipo_veiculo">Por Tipo de Aeronave</Select.Option>
                  <Select.Option value="aeronave_fase_operacao">Por Fase de Operação</Select.Option>
                  <Select.Option value="aeronave_nivel_dano">Por Nível de Dano</Select.Option>
                  <Select.Option value="ocorrencia_tipo">Por Tipo de Ocorrência</Select.Option>
                  <Select.Option value="aeronave_fabricante">Por Fabricante</Select.Option>
                  <Select.Option value="aeronave_operador_categoria">Por Operador</Select.Option>
                  <Select.Option value="investigacao_status">Por Status da Investigação</Select.Option>
                </Select>
              </div>
              
              {segmentBy && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <span className="text-blue-800">
                    📊 Segmentando por: {segmentBy === "ocorrencia_classificacao" ? "Classificação" :
                    segmentBy === "aeronave_tipo_veiculo" ? "Tipo de Aeronave" :
                    segmentBy === "aeronave_fase_operacao" ? "Fase de Operação" :
                    segmentBy === "aeronave_nivel_dano" ? "Nível de Dano" :
                    segmentBy === "ocorrencia_tipo" ? "Tipo de Ocorrência" :
                    segmentBy === "aeronave_fabricante" ? "Fabricante" :
                    segmentBy === "aeronave_operador_categoria" ? "Operador" :
                    segmentBy === "investigacao_status" ? "Status da Investigação" : segmentBy}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo dos filtros */}
          <Filter 
            totalRecords={ocurrences.length} 
            onFilterChange={(filterId, value) => {
              const { setFilter } = useAppStore.getState();
              setFilter(filterId, value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartsPage; 