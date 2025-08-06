import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { AirAccident } from '@/types';
import { formatDate, formatNumber, getSeverityColor, calculateAccidentStats } from '@/lib/utils';
import { MapPin, Calendar, AlertTriangle, Filter as FilterIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from 'antd';

import toast from 'react-hot-toast';
import OcurrenceMap from './OcurrenceMap';
import Filter from './Filter';

const DashboardPage: React.FC = () => {
  const { accidents, ocurrences, fetchAccidents, fetchOcurrencesCoordinates, ocurrencesTotal, filters, segmentBy } = useAppStore();
  const [selectedAccident, setSelectedAccident] = useState<AirAccident | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    console.log('Carregando dados...');
    fetchAccidents();
    fetchOcurrencesCoordinates();
  }, [fetchAccidents, fetchOcurrencesCoordinates]);

  // Log quando os dados mudam
  useEffect(() => {
    console.log('Ocurrences atualizadas:', ocurrences.length);
    if (ocurrences.length > 0) {
      console.log('Primeira ocorrência:', ocurrences[0]);
    }
  }, [ocurrences]);

  // Usar ocurrences para os cálculos de estatísticas
  const mappedOccurrences = ocurrences.map(occ => ({
    id: occ.codigo_ocorrencia,
    date: occ.ocorrencia_dia,
    location: {
      city: occ.ocorrencia_cidade,
      state: occ.ocorrencia_uf,
      country: occ.ocorrencia_pais,
      coordinates: {
        lat: occ.ocorrencia_latitude,
        lng: occ.ocorrencia_longitude
      }
    },
    aircraft: {
      type: occ.aeronave_tipo_veiculo,
      registration: occ.aeronave_matricula,
      operator: occ.aeronave_operador_categoria
    },
    fatalities: {
      total: occ.aeronave_fatalidades_total || 0,
      passengers: 0,
      crew: 0,
      ground: 0
    },
    phase: occ.aeronave_fase_operacao,
    cause: occ.ocorrencia_classificacao,
    weather: '',
    severity: occ.aeronave_nivel_dano === 'DESTRUÍDA' ? 'fatal' : 
              occ.aeronave_nivel_dano === 'DANIFICADA' ? 'major' : 'minor'
  }));

  const stats = calculateAccidentStats(mappedOccurrences);

  // Debug logs
  console.log('Ocurrences length:', ocurrences.length);
  console.log('Stats:', stats);
  console.log('Sample ocurrence:', ocurrences[0]);

  // Calcula filtros ativos
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      return value.trim() !== '';
    }).length;
  }, [filters]);

  // Filtros desabilitados temporariamente - retorna todos os acidentes
  const filteredAccidents = useMemo(() => {
    return [...accidents];
  }, [accidents]);

  const exportData = () => {
    const csvContent = [
      ['ID', 'Data', 'Cidade', 'País', 'Aeronave', 'Operadora', 'Fase', 'Causa', 'Severidade', 'Fatalidades'],
      ...filteredAccidents.map(acc => [
        acc.id,
        acc.date,
        acc.location.city,
        acc.location.country,
        acc.aircraft.type,
        acc.aircraft.operator,
        acc.phase,
        acc.cause,
        acc.severity,
        acc.fatalities.total.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidentes-aereos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Incidentes Aéreos</h2>
            <p className="text-gray-600">
              Visualize e analise dados de incidentes aéreos com gráficos e mapas interativos.
            </p>
          </div>
          
          <div>
            <Button
              variant="outline"
              onClick={exportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
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
                  onClick={() => {
                    const { clearFilters } = useAppStore.getState();
                    clearFilters();
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                
                </button>
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
            totalRecords={accidents.length} 
            onFilterChange={(filterId, value) => {
              const { setFilter } = useAppStore.getState();
              setFilter(filterId, value);
            }}
          />


        </div>
      </div>



      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Incidentes</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(ocurrencesTotal || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Fatalidades</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.fatalities || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aeronaves Destruídas</p>
              <p className="text-2xl font-bold text-gray-900">
                {ocurrences.length > 0 ? ocurrences.filter(occ => occ.aeronave_nivel_dano === 'DESTRUÍDA').length || 0 : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Investigação Finalizada</p>
              <p className="text-2xl font-bold text-gray-900">
                {ocurrences.length > 0 ? ocurrences.filter(occ => occ.investigacao_status === 'FINALIZADA').length || 0 : 0}
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Gráficos e visualizações */}
      <div className="mb-8">
        <OcurrenceMap />
      </div>

      {/* Modal de detalhes */}
      {selectedAccident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Incidente
                </h3>
                <button
                  onClick={() => setSelectedAccident(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedAccident.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Localização</label>
                  <p className="text-sm text-gray-900">
                    {selectedAccident.location.city}, {selectedAccident.location.country}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Aeronave</label>
                  <p className="text-sm text-gray-900">{selectedAccident.aircraft.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Operadora</label>
                  <p className="text-sm text-gray-900">{selectedAccident.aircraft.operator}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fase</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedAccident.phase}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Causa</label>
                  <p className="text-sm text-gray-900">{selectedAccident.cause}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Clima</label>
                  <p className="text-sm text-gray-900">{selectedAccident.weather}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fatalidades</label>
                  <p className="text-sm text-gray-900">
                    Total: {selectedAccident.fatalities.total} 
                    (Passageiros: {selectedAccident.fatalities.passengers}, 
                    Tripulação: {selectedAccident.fatalities.crew})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 