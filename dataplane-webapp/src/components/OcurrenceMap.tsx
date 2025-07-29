"use client"
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { OcurrenceCoordinates } from "@/types";

const OcurrenceMap = () => {
    const { ocurrences, fetchOcurrencesCoordinates, loading } = useAppStore();
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mapComponents, setMapComponents] = useState<{
        ComposableMap?: React.ComponentType<any>;
        Geographies?: React.ComponentType<any>;
        Geography?: React.ComponentType<any>;
        Marker?: React.ComponentType<any>;
    }>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [brTopoJson, setBrTopoJson] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [geoCentroidFn, setGeoCentroidFn] = useState<any>(null);

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
    }, []);

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
                Mapa de Ocorrências do Brasil ({validOcurrences.length} pontos)
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
                                        {({ geographies }: { geographies: any[] }) => (
                                            <>
                                                {geographies.map((geo: any) => {
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
                                                                    stroke: "#F1F1F1",
                                                                    strokeWidth: isSelected ? 3 : 2,
                                                                    outline: "none",
                                                                    cursor: "pointer",
                                                                    transition: "all .2s"
                                                                },
                                                                hover: {
                                                                    fill: "#0C669B",
                                                                    stroke: "#F1F1F1",
                                                                    strokeWidth: 2,
                                                                    outline: "none",
                                                                    cursor: "pointer"
                                                                },
                                                                pressed: {
                                                                    fill: "#084A6B",
                                                                    stroke: "#F1F1F1",
                                                                    strokeWidth: 2,
                                                                    outline: "none"
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })}

                                                {/* Labels dos estados */}
                                                {geographies.map((geo: any) => {
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
                                                                        {stateCount}
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

                {/* Painel de informações com scroll */}
                <div className="space-y-6 max-h-[633px] overflow-y-auto">
                    {/* Ranking de estados */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">🏆 Ranking por Estado</h3>
                        <div className="space-y-2">
                            {Object.entries(occurrencesByState)
                                .sort(([,a], [,b]) => b.length - a.length)
                                .slice(0, 20)
                                .map(([uf, occurrences], index) => (
                                    <button
                                        key={uf}
                                        onClick={() => handleStateClick(uf)}
                                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                                            selectedState === uf 
                                                ? 'bg-blue-100 border-blue-300' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        } border`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
                                                <div 
                                                    className="w-3 h-3 rounded mr-2"
                                                    style={{ backgroundColor: getStateColor(uf) }}
                                                ></div>
                                                <span className="font-medium text-gray-900">
                                                    {brazilStates[uf as keyof typeof brazilStates] || uf}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: '#0C669B' }}>
                                                {occurrences.length}
                                            </span>
                                        </div>
                                    </button>
                                ))}
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
                                        {selectedStateOccurrences.length}
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
                                        +{selectedStateOccurrences.length - 5} mais ocorrências
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
                                    <span className="font-bold" style={{ color: '#0C669B' }}>{validOcurrences.length}</span>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: '#66B3D9' }}>Média por Estado</span>
                                    <span className="font-bold" style={{ color: '#66B3D9' }}>
                                        {Math.round(validOcurrences.length / Object.keys(occurrencesByState).length)}
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