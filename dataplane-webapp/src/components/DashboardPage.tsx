import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { AirAccident } from '@/types';
import { formatDate, formatNumber, getSeverityColor, calculateAccidentStats } from '@/lib/utils';
import { MapPin, Calendar, AlertTriangle, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDashboardStore } from '@/store';
import toast from 'react-hot-toast';
import OcurrenceMap from './OcurrenceMap';

const DashboardPage: React.FC = () => {
  const { accidents, fetchAccidents, ocurrencesTotal } = useAppStore();
  const { filters, setFilters, resetFilters } = useDashboardStore();
  const [selectedAccident, setSelectedAccident] = useState<AirAccident | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fetchAccidents();
    setIsMounted(true);
  }, [fetchAccidents]);

  const stats = calculateAccidentStats(accidents);

  const filteredAccidents = useMemo(() => {
    let filtered = [...accidents];
    if (filters.dateRange.start) {
      filtered = filtered.filter(accident => new Date(accident.date) >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(accident => new Date(accident.date) <= new Date(filters.dateRange.end));
    }
    if (filters.severity.length > 0) {
      filtered = filtered.filter(accident => filters.severity.includes(accident.severity));
    }
    if (filters.phase.length > 0) {
      filtered = filtered.filter(accident => filters.phase.includes(accident.phase));
    }
    if (filters.country.length > 0) {
      filtered = filtered.filter(accident => filters.country.includes(accident.location.country));
    }
    return filtered;
  }, [accidents, filters]);

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
    a.download = `acidentes-aereos-${new Date().toISOString().split('T')[0]}.csv`;
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Acidentes Aéreos</h2>
            <p className="text-gray-600">
              Visualize e analise dados de acidentes aéreos com gráficos e mapas interativos.
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
        <Filter className="w-6 h-6" />
        
        {/* Indicador de filtros ativos */}
        {isMounted && (filters.dateRange.start || filters.dateRange.end || filters.severity.length > 0 || filters.phase.length > 0 || filters.country.length > 0) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {[
              filters.dateRange.start ? 1 : 0,
              filters.dateRange.end ? 1 : 0,
              filters.severity.length || 0,
              filters.phase.length || 0,
              filters.country.length || 0
            ].reduce((sum, count) => (sum || 0) + (count || 0), 0)}
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
          <div className="p-6 border-b border-gray-200 bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtros Avançados
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conteúdo dos filtros */}
          <div className="p-6 space-y-6">
            {/* Resumo dos Filtros Ativos */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Filtros Ativos</h4>
              <div className="text-sm text-blue-700">
                <p>Total de registros: <span className="font-bold">{filteredAccidents.length || 0}</span></p>
                {isMounted && filters.dateRange.start && (
                  <p>Data início: {new Date(filters.dateRange.start).toLocaleDateString('pt-BR')}</p>
                )}
                {isMounted && filters.dateRange.end && (
                  <p>Data fim: {new Date(filters.dateRange.end).toLocaleDateString('pt-BR')}</p>
                )}
                {isMounted && filters.severity.length > 0 && (
                  <p>Severidade: {filters.severity.join(', ')}</p>
                )}
                {isMounted && filters.phase.length > 0 && (
                  <p>Fase: {filters.phase.join(', ')}</p>
                )}
                {isMounted && filters.country.length > 0 && (
                  <p>País: {filters.country.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Severidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severidade</label>
              <select
                value={filters.severity[0] || ''}
                onChange={(e) => setFilters({ severity: e.target.value ? [e.target.value] : [] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas ({accidents.length > 0 ? new Set(accidents.map(acc => acc.severity || '')).size : 0} tipos)</option>
                {Array.from(new Set(accidents.map(acc => acc.severity || ''))).filter(s => s).sort().map(severity => (
                  <option key={severity} value={severity}>
                    {severity === 'minor' ? 'Menor' : severity === 'major' ? 'Maior' : severity === 'fatal' ? 'Fatal' : severity}
                    ({accidents.filter(acc => acc.severity === severity).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Fase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fase de Voo</label>
              <select
                value={filters.phase[0] || ''}
                onChange={(e) => setFilters({ phase: e.target.value ? [e.target.value] : [] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas ({accidents.length > 0 ? new Set(accidents.map(acc => acc.phase || '')).size : 0} fases)</option>
                {Array.from(new Set(accidents.map(acc => acc.phase || ''))).filter(p => p).sort().map(phase => (
                  <option key={phase} value={phase}>
                    {phase === 'takeoff' ? 'Decolagem' : 
                     phase === 'landing' ? 'Pouso' : 
                     phase === 'cruise' ? 'Cruzeiro' : 
                     phase === 'approach' ? 'Aproximação' : phase}
                    ({accidents.filter(acc => acc.phase === phase).length})
                  </option>
                ))}
              </select>
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
              <select
                value={filters.country[0] || ''}
                onChange={(e) => setFilters({ country: e.target.value ? [e.target.value] : [] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos ({accidents.length > 0 ? new Set(accidents.map(acc => acc.location?.country || '')).size : 0} países)</option>
                {Array.from(new Set(accidents.map(acc => acc.location?.country || ''))).filter(c => c).sort().map(country => (
                  <option key={country} value={country}>
                    {country} ({accidents.filter(acc => acc.location?.country === country).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Aeronave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Aeronave</label>
              <select
                defaultValue=""
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos ({accidents.length > 0 ? new Set(accidents.map(acc => acc.aircraft?.type || '')).size : 0} tipos)</option>
                {Array.from(new Set(accidents.map(acc => acc.aircraft?.type || ''))).filter(t => t).sort().map(type => (
                  <option key={type} value={type}>
                    {type} ({accidents.filter(acc => acc.aircraft?.type === type).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer com botões */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                Limpar Todos os Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="w-full"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
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
              <p className="text-sm font-medium text-gray-600">Total de Acidentes</p>
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
              <p className="text-sm font-medium text-gray-600">Último Acidente</p>
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
          <h3 className="text-lg font-semibold text-gray-900">Lista de Acidentes</h3>
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
                  Detalhes do Acidente
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