import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { AirAccident } from '@/types';
import { formatDate, formatNumber, getSeverityColor } from '@/lib/utils';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const IncidentsListPage: React.FC = () => {
  const { ocurrences, ocurrencesTotal } = useAppStore();
  const [selectedAccident, setSelectedAccident] = useState<AirAccident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Função para mapear o nível de dano para severity
  const mapSeverity = (nivelDano: string): 'minor' | 'major' | 'fatal' => {
    switch (nivelDano) {
      case 'DESTRUÍDA':
        return 'fatal';
      case 'DANIFICADA':
        return 'major';
      default:
        return 'minor';
    }
  };

  // Converter ocurrences para o formato esperado pela tabela
  const mappedOccurrences = useMemo(() => {
    return ocurrences.map(occ => ({
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
      severity: mapSeverity(occ.aeronave_nivel_dano)
    }));
  }, [ocurrences]);

  // Paginação
  const totalPages = Math.ceil(mappedOccurrences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOccurrences = mappedOccurrences.slice(startIndex, endIndex);

  const exportData = () => {
    const csvContent = [
      ['ID', 'Data', 'Cidade', 'Estado', 'País', 'Aeronave', 'Operadora', 'Fase', 'Classificação', 'Severidade', 'Fatalidades'],
      ...mappedOccurrences.map(acc => [
        acc.id,
        acc.date,
        acc.location.city,
        acc.location.state,
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

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lista de Incidentes</h2>
              <p className="text-gray-600">
                Visualize todos os incidentes aéreos com detalhes completos.
              </p>
            </div>
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

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 text-blue-600 text-center font-bold">📊</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Incidentes</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(mappedOccurrences.length)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="w-6 h-6 text-red-600 text-center font-bold">💀</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Fatalidades</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(mappedOccurrences.reduce((sum, acc) => sum + acc.fatalities.total, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 text-purple-600 text-center font-bold">🔥</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aeronaves Destruídas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mappedOccurrences.filter(acc => acc.severity === 'fatal').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 text-green-600 text-center font-bold">✅</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Página Atual</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPage} de {totalPages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de incidentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Incidentes ({startIndex + 1}-{Math.min(endIndex, mappedOccurrences.length)} de {mappedOccurrences.length})
          </h3>
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
              {paginatedOccurrences.map((accident) => (
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
                      <div className="text-gray-500">{accident.location.state} - {accident.location.country}</div>
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, mappedOccurrences.length)} de {mappedOccurrences.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  size="sm"
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  size="sm"
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
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
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
                  <p><strong>ID:</strong> {selectedAccident.id}</p>
                  <p><strong>Data:</strong> {formatDate(selectedAccident.date)}</p>
                  <p><strong>Fase:</strong> {selectedAccident.phase}</p>
                  <p><strong>Classificação:</strong> {selectedAccident.cause}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Localização</h4>
                  <p><strong>Cidade:</strong> {selectedAccident.location.city}</p>
                  <p><strong>Estado:</strong> {selectedAccident.location.state}</p>
                  <p><strong>País:</strong> {selectedAccident.location.country}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Aeronave</h4>
                  <p><strong>Tipo:</strong> {selectedAccident.aircraft.type}</p>
                  <p><strong>Matrícula:</strong> {selectedAccident.aircraft.registration}</p>
                  <p><strong>Operador:</strong> {selectedAccident.aircraft.operator}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vítimas</h4>
                  <p><strong>Total de Fatalidades:</strong> {selectedAccident.fatalities.total}</p>
                  <p><strong>Passageiros:</strong> {selectedAccident.fatalities.passengers}</p>
                  <p><strong>Tripulação:</strong> {selectedAccident.fatalities.crew}</p>
                  <p><strong>Pessoas em Terra:</strong> {selectedAccident.fatalities.ground}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsListPage; 