import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Função para combinar classes CSS com Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar data
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Função para formatar número
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

// Função para gerar cores baseadas em severidade
export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'fatal':
      return '#ef4444'; // red-500
    case 'major':
      return '#f97316'; // orange-500
    case 'minor':
      return '#eab308'; // yellow-500
    default:
      return '#6b7280'; // gray-500
  }
}

// Define o tipo para um objeto de acidente
interface Accident {
  fatalities?: { total?: number };
  severity?: string;
  phase?: string;
}

// Função para calcular estatísticas de acidentes
export function calculateAccidentStats(accidents: Accident[]) {
  const total = accidents.length;
  const fatalities = accidents.reduce((sum, acc) => sum + (acc.fatalities?.total || 0), 0);
  const bySeverity = accidents.reduce((acc, accident) => {
    const severity = accident.severity || 'unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPhase = accidents.reduce((acc, accident) => {
    const phase = accident.phase || 'unknown';
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    fatalities,
    bySeverity,
    byPhase,
  };
}

// Função para debounce
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Função para validar coordenadas
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Função para calcular distância entre dois pontos
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
} 