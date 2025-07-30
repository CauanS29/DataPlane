import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { AirAccident } from '@/types';
import { formatDate, formatNumber, getSeverityColor, calculateAccidentStats } from '@/lib/utils';
import { MapPin, Calendar, AlertTriangle, Filter as FilterIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import toast from 'react-hot-toast';
import OcurrenceMap from './OcurrenceMap';
import Filter from './Filter';

const DashboardPage: React.FC = () => {
  const { accidents, fetchAccidents, ocurrencesTotal } = useAppStore();
  const [selectedAccident, setSelectedAccident] = useState<AirAccident | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAccidents();
  }, [fetchAccidents]);

  const stats = calculateAccidentStats(accidents);

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
        
        {/* Badge será adicionado quando filtros tiverem lógica */}
        
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
              <p className="text-sm font-medium text-gray-600">Fatalidades</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.fatalities || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Último Incidente</p>
              <p className="text-lg font-semibold text-gray-900">
                {accidents.length > 0 ? formatDate(accidents[0].date) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Países Afetados</p>
              <p className="text-2xl font-bold text-gray-900">
                {accidents.length > 0 ? new Set(accidents.map(acc => acc.location?.country).filter(c => c)).size : 0}
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Gráficos e visualizações */}
      <div className="mb-8">
        <OcurrenceMap />
      </div>

      {/* Lista de acidentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Incidentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aeronave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatalidades
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccidents.map((accident) => (
                <tr
                  key={accident.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAccident(accident)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(accident.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{accident.location.city}</div>
                      <div className="text-gray-500">{accident.location.country}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{accident.aircraft.type}</div>
                      <div className="text-gray-500">{accident.aircraft.operator}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {accident.phase}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: getSeverityColor(accident.severity) + '20',
                        color: getSeverityColor(accident.severity)
                      }}
                    >
                      {accident.severity === 'minor' ? 'Menor' : 
                       accident.severity === 'major' ? 'Maior' : 'Fatal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {accident.fatalities.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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