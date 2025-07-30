"use client";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { OcurrenceCoordinates } from "@/types";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Map, List, Plane, Activity, AlertTriangle, AlertCircle } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Tipos para o mapa
import { ComposableMapProps, GeographiesProps, GeographyProps, MarkerProps } from 'react-simple-maps';
import { ExtendedFeature } from 'd3-geo';

interface GeoFeature extends ExtendedFeature {
    properties: {
        id?: string;
        [key: string]: unknown;
    };
    rsmKey?: string;
}

const OcurrenceMap = () => {
    const { ocurrences, fetchOcurrencesCoordinates, loading, filters } = useAppStore();
    const [isClient, setIsClient] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("estados");
    const [mapComponents, setMapComponents] = useState<{
        ComposableMap?: React.ComponentType<ComposableMapProps>;
        Geographies?: React.ComponentType<GeographiesProps>;
        Geography?: React.ComponentType<GeographyProps>;
        Marker?: React.ComponentType<MarkerProps>;
    }>({});
    const [brTopoJson, setBrTopoJson] = useState<unknown>(null);
    const [geoCentroidFn, setGeoCentroidFn] = useState<((geo: GeoFeature) => [number, number]) | null>(null);

    useEffect(() => {
        fetchOcurrencesCoordinates();
    }, [fetchOcurrencesCoordinates]);

    // Carregar componentes e dados
    useEffect(() => {
        const loadMapComponents = async () => {
            try {
                const [mapMod, d3Mod, topoData] = await Promise.all([
                    import("react-simple-maps"),
                    import("d3-geo"),
                    import("./br-topo.json")
                ]);
                
                setMapComponents({
                    ComposableMap: mapMod.ComposableMap,
                    Geographies: mapMod.Geographies,
                    Geography: mapMod.Geography,
                    Marker: mapMod.Marker,
                });
                
                setGeoCentroidFn(() => (geo: GeoFeature) => d3Mod.geoCentroid(geo));
                setBrTopoJson(topoData.default);
                setIsClient(true);
            } catch (error) {
                console.error("Erro ao carregar componentes:", error);
            }
        };

        loadMapComponents();
    }, []);

    // Verificação de segurança para garantir que ocurrences seja um array
    const safeOcurrences = Array.isArray(ocurrences) ? ocurrences : [];

    // Filtra apenas ocorrências com coordenadas válidas e aplica filtros
    const validOcurrences = safeOcurrences.filter(occ => {
        // Primeiro verifica as coordenadas
        const hasValidCoordinates = occ.ocorrencia_latitude && occ.ocorrencia_longitude &&
            occ.ocorrencia_latitude !== 0 && occ.ocorrencia_longitude !== 0;

        if (!hasValidCoordinates) return false;

        // Depois aplica os filtros ativos
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true; // Ignora filtros vazios

            // Mapeamento dos IDs dos filtros para os campos da ocorrência
            const filterMapping: Record<string, keyof typeof occ> = {
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
            if (!field) return true; // Ignora filtros desconhecidos

            const occValue = occ[field];
            if (typeof occValue !== 'string') return true; // Ignora campos não string

            // Compara ignorando case e removendo espaços extras
            if (Array.isArray(value)) {
                return value.length === 0 || value.some(v => occValue.trim().toLowerCase() === v.trim().toLowerCase());
            }
            return occValue.trim().toLowerCase() === value.trim().toLowerCase();
        });
    });

    // Agrupa ocorrências por UF
    const occurrencesByState = validOcurrences.reduce((acc, occ) => {
        const uf = occ.ocorrencia_uf || 'Não informado';
        if (!acc[uf]) {
            acc[uf] = [];
        }
        acc[uf].push(occ);
        return acc;
    }, {} as Record<string, OcurrenceCoordinates[]>);

    // Ocorrências dos estados selecionados
    const selectedStates = Array.isArray(filters['state']) ? filters['state'] : (filters['state'] ? [filters['state']] : []);
    const selectedStatesOccurrences = selectedStates.length > 0 
        ? selectedStates.flatMap(state => occurrencesByState[state] || [])
        : [];

    // Mapeamento de estados brasileiros
    const brazilStates = {
        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
        'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
        'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
        'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
        'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
        'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
        'SE': 'Sergipe', 'TO': 'Tocantins'
    };

    // Calcula a cor do estado baseado no número de ocorrências
    const getStateColor = (stateCode: string) => {
        const count = occurrencesByState[stateCode]?.length || 0;
        if (count === 0) return '#ECEFF1';
        
        const maxOccurrences = Math.max(...Object.values(occurrencesByState).map(arr => arr.length));
        const intensity = count / maxOccurrences;
        
        if (intensity <= 0.2) return '#E6F2FA';
        if (intensity <= 0.4) return '#B3D9F0';
        if (intensity <= 0.6) return '#66B3D9';
        if (intensity <= 0.8) return '#3399CC';
        return '#0C669B';
    };

    // Função chamada quando um estado é clicado
    const handleStateClick = (state: string) => {
        console.log('Estado clicado:', state);
        const currentSelectedStates = Array.isArray(filters['state']) ? filters['state'] : (filters['state'] ? [filters['state']] : []);
        const newSelectedStates = currentSelectedStates.includes(state)
            ? currentSelectedStates.filter((s: string) => s !== state)
            : [...currentSelectedStates, state];
        
        // Atualiza o filtro no store global
        const { setFilter } = useAppStore.getState();
        setFilter('state', newSelectedStates);
    };

    // Função auxiliar para gerar dados por campo
    const generateDataByField = (data: OcurrenceCoordinates[], field: keyof OcurrenceCoordinates) => {
        const counts: { [key: string]: number } = {};
        data.forEach(occ => {
            const key = (occ[field] as string) || 'Não informado';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    };

    // Mapeamento de tipos de gráfico para campos de dados
    const chartFieldMapping: { [key: string]: keyof OcurrenceCoordinates } = {
        "classificacao": "ocorrencia_classificacao",
        "aeronave": "aeronave_tipo_veiculo",
        "fase": "aeronave_fase_operacao",
        "dano": "aeronave_nivel_dano",
        "occurrence_type": "ocorrencia_tipo"
    };

    // Função para gerar dados dos gráficos
    const generateChartData = (type: string) => {
        let data: { [key: string]: number } = {};
        const dataToAnalyze = selectedStates.length > 0 ? selectedStatesOccurrences : validOcurrences;
        
        // Caso especial para estados/cidades
        if (type === "estados") {
            if (selectedStates.length > 0) {
                data = generateDataByField(dataToAnalyze, "ocorrencia_cidade");
            } else {
                data = Object.keys(occurrencesByState).reduce((acc, uf) => {
                    acc[uf] = occurrencesByState[uf].length;
                    return acc;
                }, {} as { [key: string]: number });
            }
        } 
        // Para todos os outros tipos, usa o mapeamento
        else if (chartFieldMapping[type]) {
            data = generateDataByField(dataToAnalyze, chartFieldMapping[type]);
        }
        
        // Ordenar por valor decrescente e pegar os top 10
        const sortedEntries = Object.entries(data)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
            
        return {
            labels: sortedEntries.map(([key]) => key),
            datasets: [{
                label: selectedStates.length > 0 
                    ? `${selectedStates.map((s: string) => brazilStates[s as keyof typeof brazilStates] || s).join(', ')} - ${dataToAnalyze.length || 0} ocorrências`
                    : `Brasil - ${validOcurrences.length || 0} ocorrências`,
                data: sortedEntries.map(([,value]) => value),
                backgroundColor: [
                    '#0C669B', '#1976D2', '#2196F3', '#42A5F5', '#64B5F6',
                    '#90CAF9', '#BBDEFB', '#E3F2FD', '#F5F5F5', '#EEEEEE'
                ],
                borderColor: '#0C669B',
                borderWidth: 1,
            }]
        };
    };

    // Configuração dos gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: { parsed: { y: number } }) => {
                        return `${context.parsed.y} ocorrências`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
                grid: {
                    display: false
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10,
                    autoSkip: false,
                                                        callback: function(value: string | number, index: number, values: any) {
                        const labels = this.chart.data.labels;
                        if (!labels) return '';
                        const label = labels[index];
                        if (typeof label === 'string') {
                            return label.length > 15 ? label.substring(0, 15) + '...' : label;
                        }
                        return '';
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false,
                }
            }
        },
        layout: {
            padding: {
                bottom: 25 // Espaço extra para as legendas rotacionadas
            }
        }
    };

    const { ComposableMap, Geographies, Geography, Marker } = mapComponents;
    const allComponentsLoaded = ComposableMap && Geographies && Geography && Marker && brTopoJson && geoCentroidFn;



    const LoadingState = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Ocorrências</h1>
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">
                        {!isClient || !allComponentsLoaded ? 'Carregando mapa...' : 'Carregando ocorrências...'}
                    </p>
                </div>
            </div>
        </div>
    );

    if (!isClient || !allComponentsLoaded || loading) {
        return <LoadingState />;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-4">
                Mapa de Ocorrências do Brasil ({validOcurrences.length || 0} pontos)
            </h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Mapa do Brasil */}
                <div className="xl:col-span-3">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Mapa Interativo do Brasil</h3>
                            <p className="text-sm text-gray-600">
                                Cores representam a intensidade de ocorrências. Clique para detalhes.
                            </p>
                        </div>
                        
                        <div className="flex justify-center overflow-hidden">
                            <div style={{ backgroundColor: "#F9FAFB", borderRadius: "8px", minHeight: "450px", minWidth: "600px" }}>
                                <ComposableMap
                                    projection="geoMercator"
                                    projectionConfig={{
                                        scale: 700,
                                        center: [-54, -15]
                                    }}
                                    width={600}
                                    height={480}
                                >
                                    <Geographies geography={brTopoJson}>
                                        {({ geographies }: { geographies: GeoFeature[] }) => (
                                            <>
                                                {geographies.map((geo: GeoFeature) => {
                                                    const geoId = geo.properties?.id || 'unknown';
                                                    const stateColor = getStateColor(geoId);
                                                    const isSelected = selectedStates.includes(geoId);
                                                    
                                                    return (
                                                        <Geography
                                                            key={geo.rsmKey + "-Geography"}
                                                            stroke="#FFF"
                                                            geography={geo}
                                                            onClick={() => handleStateClick(geoId)}
                                                            style={{
                                                                default: {
                                                                    fill: stateColor,
                                                                    stroke: isSelected ? "#FFFFFF" : "#F1F1F1",
                                                                    strokeWidth: isSelected ? 4 : 2,
                                                                    outline: "none",
                                                                    cursor: "pointer",
                                                                    transition: "all .2s"
                                                                },
                                                                hover: {
                                                                    fill: "#0C669B",
                                                                    stroke: isSelected ? "#FFFFFF" : "#F1F1F1",
                                                                    strokeWidth: isSelected ? 4 : 2,
                                                                    outline: "none",
                                                                    cursor: "pointer"
                                                                },
                                                                pressed: {
                                                                    fill: "#084A6B",
                                                                    stroke: isSelected ? "#FFFFFF" : "#F1F1F1",
                                                                    strokeWidth: isSelected ? 4 : 2,
                                                                    outline: "none"
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })}

                                                {/* Labels dos estados */}
                                                {geographies.map((geo: GeoFeature) => {
                                                    try {
                                                        const centroid = geoCentroidFn(geo);
                                                        const geoId = geo.properties?.id || 'unknown';
                                                        // Sempre mostra o total de ocorrências do estado
                                                        const stateCount = ocurrences.filter(occ => occ.ocorrencia_uf === geoId).length || 0;
                                                        
                                                        return (
                                                            <Marker key={`${geo.rsmKey}-Label`} coordinates={centroid}>
                                                                <text
                                                                    x={0}
                                                                    y={0}
                                                                    fontSize={12}
                                                                    textAnchor="middle"
                                                                    fill="#374151"
                                                                    fontWeight="500"
                                                                    style={{ pointerEvents: "none" }}
                                                                >
                                                                    {geoId}
                                                                </text>
                                                                {stateCount > 0 && (
                                                                    <text
                                                                        x={0}
                                                                        y={12}
                                                                        fontSize={10}
                                                                        textAnchor="middle"
                                                                        fill="#1F2937"
                                                                        fontWeight="bold"
                                                                        style={{ pointerEvents: "none" }}
                                                                    >
                                                                        {stateCount || 0}
                                                                    </text>
                                                                )}
                                                            </Marker>
                                                        );
                                                    } catch (error) {
                                                        console.error("Erro no centroid:", error);
                                                        return null;
                                                    }
                                                })}
                                            </>
                                        )}
                                    </Geographies>
                                </ComposableMap>
                            </div>
                        </div>

                        {/* Legenda de cores */}
                        <div className="mt-4 px-4">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2 text-center">Legenda</h4>
                            <div className="flex items-center justify-center space-x-3 text-xs">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                    <span className="text-gray-600">Sem ocorrências</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#E6F2FA' }}></div>
                                    <span className="text-gray-600">Baixa</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#66B3D9' }}></div>
                                    <span className="text-gray-600">Média</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0C669B' }}></div>
                                    <span className="text-gray-600">Alta</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Painel de gráficos com tabs */}
                <div className="xl:col-span-2 space-y-6 max-h-[633px] overflow-y-auto">
                    {/* Tabs de gráficos */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">📊 Análise por Gráficos</h3>
                        
                        {/* Tab navigation */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { id: "estados", label: "Por Estado", icon: "map" },
                                { id: "classificacao", label: "Classificação", icon: "list" },
                                { id: "aeronave", label: "Tipo Aeronave", icon: "plane" },
                                { id: "fase", label: "Fase Operação", icon: "activity" },
                                { id: "dano", label: "Nível Dano", icon: "alert-triangle" },
                                { id: "occurrence_type", label: "Tipo Ocorrência", icon: "alert-circle" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {(() => {
                                        const IconMap = {
                                            map: Map,
                                            list: List,
                                            plane: Plane,
                                            activity: Activity,
                                            'alert-triangle': AlertTriangle,
                                            'alert-circle': AlertCircle
                                        };
                                        const Icon = IconMap[tab.icon as keyof typeof IconMap];
                                        return <Icon className="w-4 h-4 inline-block mr-1" />;
                                    })()} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Gráfico */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="h-80">
                                <Bar 
                                    data={generateChartData(activeTab)} 
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas e Detalhes */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">
                                {selectedStates.length > 0 
                                    ? `📍 ${selectedStates.map(s => brazilStates[s as keyof typeof brazilStates] || s).join(', ')}`
                                    : "📊 Estatísticas Gerais"
                                }
                            </h4>
                            <span className="text-sm text-gray-500">
                                {(selectedStates.length > 0 ? selectedStatesOccurrences.length : validOcurrences.length) || 0} ocorrências registradas
                            </span>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-sm text-red-800 mb-1">Fatalidades</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-red-700">
                                            {(selectedStates.length > 0 ? selectedStatesOccurrences : validOcurrences)
                                                .reduce((acc, occ) => acc + (occ.aeronave_fatalidades_total || 0), 0)}
                                        </span>
                                        <span className="text-xs text-red-600">ocorrências registradas</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-sm text-orange-800 mb-1">Aeronaves Destruídas</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-orange-700">
                                            {(selectedStates.length > 0 ? selectedStatesOccurrences : validOcurrences)
                                                .filter(occ => occ.aeronave_nivel_dano?.toLowerCase().includes('destruída')).length}
                                        </span>
                                        <span className="text-xs text-orange-600">ocorrências registradas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-sm text-yellow-800 mb-1">Saída de Pista</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-yellow-700">
                                            {(selectedStates.length > 0 ? selectedStatesOccurrences : validOcurrences)
                                                .filter(occ => occ.ocorrencia_saida_pista === 'SIM').length}
                                        </span>
                                        <span className="text-xs text-yellow-600">ocorrências registradas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-sm text-blue-800 mb-1">Investigações em Curso</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-blue-700">
                                            {(selectedStates.length > 0 ? selectedStatesOccurrences : validOcurrences)
                                                .filter(occ => occ.investigacao_status?.toLowerCase().includes('ativa')).length}
                                        </span>
                                        <span className="text-xs text-blue-600">ocorrências registradas</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lista de ocorrências (só aparece quando estados estão selecionados) */}
                        {selectedStates.length > 0 && (
                            <div className="space-y-3">
                                {selectedStatesOccurrences.slice(0, 5).map((occ, index) => (
                                    <div key={index} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">#{occ.codigo_ocorrencia}</span>
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                                {occ.ocorrencia_classificacao}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">📍 {occ.ocorrencia_cidade}</p>
                                        <p className="text-sm text-gray-500">📅 {occ.ocorrencia_dia}</p>
                                    </div>
                                ))}
                                
                                {selectedStatesOccurrences.length > 5 && (
                                    <p className="text-sm text-gray-500 text-center py-2">
                                        +{selectedStatesOccurrences.length - 5} mais ocorrências
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OcurrenceMap;