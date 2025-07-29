"use client"
import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const OcurrenceMap = () => {
    const mapRef = useRef<L.Map | null>(null);
    const { ocurrences, fetchOcurrencesCoordinates } = useAppStore();

    useEffect(() => {
        fetchOcurrencesCoordinates();
    }, []);

    return (
        <div>
            <h1>Mapa de Ocorrências</h1>
            <MapContainer 
                key="occurrence-map" 
                ref={mapRef}
                center={[-15.7942, -47.8822]} 
                zoom={4} 
                style={{ height: '400px', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {ocurrences.map((ocurrence) => (
                    <Marker key={ocurrence.codigo_ocorrencia} position={[ocurrence.ocorrencia_latitude || 0, ocurrence.ocorrencia_longitude || 0]}>
                        <Popup>
                            Código: {ocurrence.codigo_ocorrencia}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}

export default OcurrenceMap;