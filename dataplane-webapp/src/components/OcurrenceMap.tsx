"use client"
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Tipo para as geometrias do mapa
interface GeoFeature {
    properties?: {
        id?: string;
    };
    rsmKey?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

const OcurrenceMap = () => {
    const { ocurrences, fetchOcurrencesCoordinates, loading } = useAppStore();
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("estados");
    const [mapComponents, setMapComponents] = useState<{
        ComposableMap?: React.ComponentType<unknown>;
        Geographies?: React.ComponentType<unknown>;
        Geography?: React.ComponentType<unknown>;
        Marker?: React.ComponentType<unknown>;
    }>({});
    const [brTopoJson, setBrTopoJson] = useState<unknown>(null);
    const [geoCentroidFn, setGeoCentroidFn] = useState<((geo: GeoFeature) => [number, number]) | null>(null);

    useEffect(() => {
        setIsClient(true);
        fetchOcurrencesCoordinates();
        
        // Carregar componentes e dados
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
                
                setGeoCentroidFn(() => d3Mod.geoCentroid);
                setBrTopoJson(topoData.default);
                
                console.log("Todos os componentes carregados com sucesso");
            } catch (error) {
                console.error("Erro ao carregar componentes:", error);
            }
        };

        if (typeof window !== "undefined") {
            loadMapComponents();
        }
    }, [fetchOcurrencesCoordinates]);

    // Verificação de segurança para garantir que ocurrences seja um array
    const safeOcurrences = Array.isArray(ocurrences) ? ocurrences : [];

    // Filtra apenas ocorrências com coordenadas válidas
    const validOcurrences = safeOcurrences.filter(occ => 
        occ.ocorrencia_latitude && occ.ocorrencia_longitude &&
        occ.ocorrencia_latitude !== 0 && occ.ocorrencia_longitude !== 0
    );

    // Agrupa ocorrências por UF
    const occurrencesByState = validOcurrences.reduce((acc, occ) => {
        const uf = occ.ocorrencia_uf || 'Não informado';
        if (!acc[uf]) {
            acc[uf] = [];
        }
        acc[uf].push(occ);
        return acc;
    }, {} as Record<string, OcurrenceCoordinates[]>);

    // Ocorrências do estado selecionado
    const selectedStateOccurrences = selectedState ? occurrencesByState[selectedState] || [] : [];

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
        setSelectedState(selectedState === state ? null : state);
    };

    // Função para gerar dados dos gráficos
    const generateChartData = (type: string) => {
        let data: { [key: string]: number } = {};
        
        // Se há um estado selecionado, usa apenas os dados daquele estado
        // Se não há estado selecionado, usa todos os dados
        const dataToAnalyze = selectedState ? selectedStateOccurrences : validOcurrences;
        
        switch (type) {
            case "estados":
                if (selectedState) {
                    // Se um estado está selecionado, mostra por cidade
                    dataToAnalyze.forEach(occ => {
                        const key = occ.ocorrencia_cidade || 'Cidade não informada';
                        data[key] = (data[key] || 0) + 1;
                    });
                } else {
                    // Se nenhum estado selecionado, mostra por estado
                    data = Object.keys(occurrencesByState).reduce((acc, uf) => {
                        acc[uf] = occurrencesByState[uf].length;
                        return acc;
                    }, {} as { [key: string]: number });
                }
                break;
                
            case "classificacao":
                dataToAnalyze.forEach(occ => {
                    const key = occ.ocorrencia_classificacao || 'Não informado';
                    data[key] = (data[key] || 0) + 1;
                });
                break;
                
            case "aeronave":
                dataToAnalyze.forEach(occ => {
                    const key = occ.aeronave_tipo_veiculo || 'Não informado';
                    data[key] = (data[key] || 0) + 1;
                });
                break;
                
            case "fase":
                dataToAnalyze.forEach(occ => {
                    const key = occ.aeronave_fase_operacao || 'Não informado';
                    data[key] = (data[key] || 0) + 1;
                });
                break;
                
            case "dano":
                dataToAnalyze.forEach(occ => {
                    const key = occ.aeronave_nivel_dano || 'Não informado';
                    data[key] = (data[key] || 0) + 1;
                });
                break;
        }
        
        // Ordenar por valor decrescente e pegar os top 10
        const sortedEntries = Object.entries(data)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
            
        return {
            labels: sortedEntries.map(([key]) => key),
            datasets: [{
                label: selectedState 
                    ? `${brazilStates[selectedState as keyof typeof brazilStates] || selectedState} - ${dataToAnalyze.length || 0} ocorrências`
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
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    const { ComposableMap, Geographies, Geography, Marker } = mapComponents;
    const allComponentsLoaded = ComposableMap && Geographies && Geography && Marker && brTopoJson && geoCentroidFn;

    console.log("Debug - isClient:", isClient, "allComponentsLoaded:", allComponentsLoaded);

    if (!isClient || !allComponentsLoaded) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Ocorrências</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Carregando mapa...</p>
                        <p className="text-xs text-gray-400 mt-2">
                            Client: {isClient ? '✓' : '✗'} | Components: {allComponentsLoaded ? '✓' : '✗'}
                        </p>
                        <p className="text-xs text-gray-400">
                            Map: {ComposableMap ? '✓' : '✗'} | Geo: {Geographies ? '✓' : '✗'} | Data: {brTopoJson ? '✓' : '✗'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Ocorrências</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Carregando ocorrências...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-4">
                Mapa de Ocorrências do Brasil ({validOcurrences.length || 0} pontos)
            </h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Mapa do Brasil */}
                <div className="xl:col-span-2">
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
                                                    const isSelected = selectedState === geoId;
                                                    
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
                                                        const stateCount = occurrencesByState[geoId]?.length || 0;
                                                        
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
                                                                        fill="#0C669B"
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
                <div className="space-y-6 max-h-[633px] overflow-y-auto">
                    {/* Tabs de gráficos */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">📊 Análise por Gráficos</h3>
                        
                        {/* Tab navigation */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { id: "estados", label: "Por Estado", icon: "🗺️" },
                                { id: "classificacao", label: "Classificação", icon: "📋" },
                                { id: "aeronave", label: "Tipo Aeronave", icon: "✈️" },
                                { id: "fase", label: "Fase Operação", icon: "🛫" },
                                { id: "dano", label: "Nível Dano", icon: "⚠️" }
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
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Gráfico */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="h-64">
                                <Bar 
                                    data={generateChartData(activeTab)} 
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detalhes do estado selecionado */}
                    {selectedState && selectedStateOccurrences.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                📍 {brazilStates[selectedState as keyof typeof brazilStates] || selectedState}
                            </h4>
                            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: getStateColor(selectedState) + '20' }}>
                                <div className="text-center">
                                    <span className="text-2xl font-bold text-gray-900">
                                        {selectedStateOccurrences.length || 0}
                                    </span>
                                    <p className="text-xs text-gray-700">ocorrências registradas</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {selectedStateOccurrences.slice(0, 5).map((occ, index) => (
                                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium">#{occ.codigo_ocorrencia}</span>
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                                {occ.ocorrencia_classificacao}
                                            </span>
                                        </div>
                                        <p className="text-gray-600">📍 {occ.ocorrencia_cidade}</p>
                                        <p className="text-gray-500">📅 {occ.ocorrencia_dia}</p>
                                    </div>
                                ))}
                                {selectedStateOccurrences.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center py-2">
                                        +{(selectedStateOccurrences.length || 0) - 5} mais ocorrências
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Estatísticas gerais */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Estatísticas Gerais</h4>
                        <div className="space-y-3">
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: '#0C669B' }}>Total de Ocorrências</span>
                                    <span className="font-bold" style={{ color: '#0C669B' }}>{validOcurrences.length || 0}</span>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: '#66B3D9' }}>Média por Estado</span>
                                    <span className="font-bold" style={{ color: '#66B3D9' }}>
                                        {Object.keys(occurrencesByState).length > 0 ? Math.round((validOcurrences.length || 0) / Object.keys(occurrencesByState).length) : 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OcurrenceMap;