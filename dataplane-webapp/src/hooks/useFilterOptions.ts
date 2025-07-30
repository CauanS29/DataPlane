import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface FilterOptionsResponse {
  filter_options: {
    states: string[];
    cities: string[];
    classifications: string[];
    countries: string[];
    aerodromes: string[];
    aircraft_manufacturers: string[];
    aircraft_types: string[];
    aircraft_models: string[];
    damage_levels: string[];
    aircraft_operators: string[];
    operation_phases: string[];
    operation_types: string[];
    investigation_status: string[];
    aircraft_released: string[];
    occurrence_types: string[];
    occurrence_type_categories: string[];
    factor_names: string[];
    factor_aspects: string[];
    factor_areas: string[];
  };
  metadata: {
    total_unique_options: number;
    fields_available: number;
    data_source: string;
    note: string;
  };
}

export const useFilterOptions = () => {
  const [options, setOptions] = useState<FilterOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getFilterOptions();
        setOptions(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar opções de filtro');
        console.error('Erro ao buscar opções de filtro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading, error };
};