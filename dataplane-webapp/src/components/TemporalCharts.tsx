import React, { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { OcurrenceCoordinates } from '@/types';

interface TemporalChartsProps {
  ocurrences: OcurrenceCoordinates[];
  segmentBy?: string;
  filters?: Record<string, string | string[]>;
}

const TemporalCharts: React.FC<TemporalChartsProps> = ({ ocurrences, segmentBy = "", filters = {} }) => {

  // Função para aplicar filtros aos dados
  const applyFilters = (data: OcurrenceCoordinates[]) => {
    return data.filter(occ => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;

        const filterMapping: Record<string, keyof OcurrenceCoordinates> = {
          'state': 'ocorrencia_uf',
          'city': 'ocorrencia_cidade',
          'classification': 'ocorrencia_classificacao',
          'aircraft_type': 'aeronave_tipo_veiculo',
          'damage_level': 'aeronave_nivel_dano',
          'operation_phase': 'aeronave_fase_operacao',
          'operation_type': 'aeronave_tipo_operacao',
          'aircraft_manufacturer': 'aeronave_fabricante',
          'aircraft_model': 'aeronave_modelo',
          'aircraft_operator': 'aeronave_operador_categoria',
          'investigation_status': 'investigacao_status',
          'occurrence_type': 'ocorrencia_tipo'
        };

        const field = filterMapping[key];
        if (!field) return true;

        const occValue = occ[field];
        if (typeof occValue !== 'string') return true;

        if (Array.isArray(value)) {
          return value.length === 0 || value.some(v => occValue.trim().toLowerCase() === v.trim().toLowerCase());
        }
        return occValue.trim().toLowerCase() === value.trim().toLowerCase();
      });
    });
  };

  // Dados filtrados
  const filteredOcurrences = applyFilters(ocurrences);

  // Processar dados temporais
  const temporalData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    const yearlyData: { [key: string]: number } = {};
    const fatalitiesByMonth: { [key: string]: number } = {};
    const severityByMonth: { [key: string]: { fatal: number; major: number; minor: number } } = {};

    filteredOcurrences.forEach(occ => {
      const date = new Date(occ.ocorrencia_dia.split('/').reverse().join('-'));
      const year = date.getFullYear();
      const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = year.toString();

      // Contagem mensal
      monthlyData[month] = (monthlyData[month] || 0) + 1;
      yearlyData[yearKey] = (yearlyData[yearKey] || 0) + 1;

      // Fatalidades mensais
      fatalitiesByMonth[month] = (fatalitiesByMonth[month] || 0) + (occ.aeronave_fatalidades_total || 0);

      // Severidade mensal
      if (!severityByMonth[month]) {
        severityByMonth[month] = { fatal: 0, major: 0, minor: 0 };
      }
      const severity = occ.aeronave_nivel_dano === 'DESTRUÍDA' ? 'fatal' : 
                      occ.aeronave_nivel_dano === 'DANIFICADA' ? 'major' : 'minor';
      severityByMonth[month][severity]++;
    });

    return {
      monthlyData,
      yearlyData,
      fatalitiesByMonth,
      severityByMonth
    };
  }, [filteredOcurrences]);

  // Gráfico de linha - Incidentes por ano
  const incidentsByYearChart = {
    labels: Object.keys(temporalData.yearlyData).sort(),
    datasets: [
      {
        label: 'Incidentes por Ano',
        data: Object.keys(temporalData.yearlyData).sort().map(year => temporalData.yearlyData[year]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Gráfico por ano
  const generateYearChart = () => {
    const yearlyData: { [key: string]: number } = {};
    
    filteredOcurrences.forEach(occ => {
      const date = new Date(occ.ocorrencia_dia.split('/').reverse().join('-'));
      const year = date.getFullYear().toString();
      yearlyData[year] = (yearlyData[year] || 0) + 1;
    });

    const years = Object.keys(yearlyData).sort();
    
    return {
      labels: years,
      datasets: [{
        label: 'Incidentes por Ano',
        data: years.map(year => yearlyData[year]),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 2,
      }]
    };
  };

  // Gráfico de fatalidades por ano
  const generateFatalitiesByYearChart = () => {
    const fatalitiesByYear: { [key: string]: number } = {};
    
    filteredOcurrences.forEach(occ => {
      const date = new Date(occ.ocorrencia_dia.split('/').reverse().join('-'));
      const year = date.getFullYear().toString();
      fatalitiesByYear[year] = (fatalitiesByYear[year] || 0) + (occ.aeronave_fatalidades_total || 0);
    });

    const years = Object.keys(fatalitiesByYear).sort();
    
    return {
      labels: years,
      datasets: [{
        label: 'Fatalidades por Ano',
        data: years.map(year => fatalitiesByYear[year]),
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 2,
      }]
    };
  };

     // Gráfico geral com segmentação
   const generateGeneralChart = () => {
     if (!segmentBy || segmentBy === "") {
       return null;
     }

     const yearlyData: { [key: string]: { [key: string]: number } } = {};

     filteredOcurrences.forEach(occ => {
       const date = new Date(occ.ocorrencia_dia.split('/').reverse().join('-'));
       const year = date.getFullYear().toString();
       const segmentValue = (occ[segmentBy as keyof OcurrenceCoordinates] as string) || 'Não informado';

       if (!yearlyData[year]) {
         yearlyData[year] = {};
       }
       if (!yearlyData[year][segmentValue]) {
         yearlyData[year][segmentValue] = 0;
       }
       yearlyData[year][segmentValue]++;
     });

     const years = Object.keys(yearlyData).sort();
     const allSegmentValues = new Set<string>();
     Object.values(yearlyData).forEach(segment => {
       Object.keys(segment).forEach(key => allSegmentValues.add(key));
     });

     // Calcular total por categoria para ordenar
     const categoryTotals: { [key: string]: number } = {};
     Array.from(allSegmentValues).forEach(category => {
       categoryTotals[category] = years.reduce((sum, year) => sum + (yearlyData[year][category] || 0), 0);
     });

     // Ordenar por total e pegar apenas as top 6 categorias
     const sortedCategories = Object.entries(categoryTotals)
       .sort(([,a], [,b]) => b - a)
       .slice(0, 6)
       .map(([category]) => category);

     const colors = [
       '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
       '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
     ];

     // Criar datasets para as top categorias
     const topDatasets = sortedCategories.map((segmentLabel, index) => ({
       label: segmentLabel,
       data: years.map(year => yearlyData[year][segmentLabel] || 0),
       backgroundColor: colors[index % colors.length],
       borderColor: colors[index % colors.length],
       borderWidth: 2,
       borderRadius: 4,
     }));

     // Se há mais de 6 categorias, criar dataset "Outros"
     if (sortedCategories.length < allSegmentValues.size) {
       const otherData = years.map(year => {
         return Array.from(allSegmentValues)
           .filter(category => !sortedCategories.includes(category))
           .reduce((sum, category) => sum + (yearlyData[year][category] || 0), 0);
       });

       if (otherData.some(value => value > 0)) {
         topDatasets.push({
           label: 'Outros',
           data: otherData,
           backgroundColor: '#9CA3AF',
           borderColor: '#6B7280',
           borderWidth: 2,
           borderRadius: 4,
         });
       }
     }

     return {
       labels: years,
       datasets: topDatasets
     };
   };

  const fatalitiesByYearChartData = generateFatalitiesByYearChart();
  const generalChartData = generateGeneralChart();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

     // Opções específicas para gráfico horizontal
   const horizontalChartOptions = {
     responsive: true,
     maintainAspectRatio: false,
     indexAxis: 'y' as const, // Torna o gráfico horizontal
     plugins: {
       legend: {
         position: 'bottom' as const,
         labels: {
           padding: 10,
           font: { size: 10 },
           usePointStyle: true,
           pointStyle: 'circle'
         }
       },
       title: {
         display: false,
       },
     },
     scales: {
       x: { // Agora o eixo X é o principal
         beginAtZero: true,
       },
       y: { // Eixo Y para categorias
         beginAtZero: true,
         ticks: {
           font: {
             size: 11
           }
         }
       },
     },
     elements: {
       bar: {
         borderWidth: 2,
         borderRadius: 4,
       }
     },
   };

  return (
    <div className="w-full space-y-8">
      {/* Gráfico de linha - Incidentes por ano (largura total) */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução Anual de Incidentes</h3>
        <div className="h-80 w-full">
          <Line width={'100%'} data={incidentsByYearChart} options={chartOptions} />
        </div>
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Gráfico de fatalidades por ano */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fatalidades por Ano</h3>
          <div className="h-80">
            <Bar data={fatalitiesByYearChartData} options={chartOptions} />
          </div>
        </div>

                 {/* Gráfico geral com segmentação */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             {segmentBy && segmentBy !== "" 
               ? `Análise Geral - ${segmentBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
               : "Análise Geral"
             }
           </h3>
           <div className="h-96">
                         {generalChartData ? (
               <Bar 
                 data={generalChartData} 
                 options={horizontalChartOptions}
               />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Selecione uma segmentação no filtro
                  </p>
                  <p className="text-sm text-gray-500">
                    para visualizar dados customizados por ano
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalCharts; 