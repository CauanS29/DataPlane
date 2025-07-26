import React, { useState, useEffect } from 'react';
import { useAppStore, useDashboardStore } from '@/store';
import { AirAccident } from '@/types';
import { formatDate, formatNumber, getSeverityColor, calculateAccidentStats } from '@/lib/utils';
import { BarChart3, MapPin, Calendar, AlertTriangle, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

// Dados de exemplo para acidentes aéreos
const sampleAccidents: AirAccident[] = [
  {
    id: '1',
    date: '2024-01-15',
    location: {
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      coordinates: { lat: -23.5505, lng: -46.6333 }
    },
    aircraft: {
      type: 'Boeing 737',
      registration: 'PR-GTD',
      operator: 'Gol Linhas Aéreas'
    },
    fatalities: {
      total: 0,
      passengers: 0,
      crew: 0,
      ground: 0
    },
    phase: 'landing',
    cause: 'Pista molhada',
    weather: 'Chuva',
    severity: 'minor'
  },
  {
    id: '2',
    date: '2024-01-10',
    location: {
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      coordinates: { lat: -22.9068, lng: -43.1729 }
    },
    aircraft: {
      type: 'Airbus A320',
      registration: 'PT-MRO',
      operator: 'LATAM'
    },
    fatalities: {
      total: 2,
      passengers: 1,
      crew: 1,
      ground: 0
    },
    phase: 'takeoff',
    cause: 'Falha no motor',
    weather: 'Céu limpo',
    severity: 'major'
  },
  {
    id: '3',
    date: '2024-01-05',
    location: {
      city: 'Brasília',
      state: 'DF',
      country: 'Brasil',
      coordinates: { lat: -15.7942, lng: -47.8822 }
    },
    aircraft: {
      type: 'Embraer E190',
      registration: 'PR-AKE',
      operator: 'Azul Linhas Aéreas'
    },
    fatalities: {
      total: 0,
      passengers: 0,
      crew: 0,
      ground: 0
    },
    phase: 'cruise',
    cause: 'Turbulência',
    weather: 'Tempestade',
    severity: 'minor'
  }
];

const DashboardPage: React.FC = () => {
  const { accidents, setAccidents, loading, setLoading } = useAppStore();
  const { filters, setFilters, resetFilters } = useDashboardStore();
  const [selectedAccident, setSelectedAccident] = useState<AirAccident | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Carrega dados de exemplo
    if (accidents.length === 0) {
      setAccidents(sampleAccidents);
    }
  }, [accidents.length, setAccidents]);

  const stats = calculateAccidentStats(accidents);

  const filteredAccidents = accidents.filter(accident => {
    if (filters.dateRange.start && new Date(accident.date) < new Date(filters.dateRange.start)) return false;
    if (filters.dateRange.end && new Date(accident.date) > new Date(filters.dateRange.end)) return false;
    if (filters.severity.length > 0 && !filters.severity.includes(accident.severity)) return false;
    if (filters.phase.length > 0 && !filters.phase.includes(accident.phase)) return false;
    if (filters.country.length > 0 && !filters.country.includes(accident.location.country)) return false;
    return true;
  });

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Acidentes Aéreos</h2>
        <p className="text-gray-600">
          Visualize e analise dados de acidentes aéreos com gráficos e mapas interativos.
        </p>
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
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.fatalities)}</p>
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
                {new Set(accidents.map(acc => acc.location.country)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })}
            />
            <Input
              label="Data Fim"
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
              <select
                multiple
                value={filters.severity}
                onChange={(e) => setFilters({ severity: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="minor">Menor</option>
                <option value="major">Maior</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
              <select
                multiple
                value={filters.phase}
                onChange={(e) => setFilters({ phase: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="takeoff">Decolagem</option>
                <option value="landing">Pouso</option>
                <option value="cruise">Cruzeiro</option>
                <option value="approach">Aproximação</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos e visualizações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico por severidade */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acidentes por Severidade</h3>
          <div className="space-y-3">
            {Object.entries(stats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: getSeverityColor(severity) }}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {severity === 'minor' ? 'Menor' : severity === 'major' ? 'Maior' : 'Fatal'}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico por fase */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acidentes por Fase</h3>
          <div className="space-y-3">
            {Object.entries(stats.byPhase).map(([phase, count]) => (
              <div key={phase} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {phase === 'takeoff' ? 'Decolagem' : 
                   phase === 'landing' ? 'Pouso' : 
                   phase === 'cruise' ? 'Cruzeiro' : 
                   phase === 'approach' ? 'Aproximação' : phase}
                </span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
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