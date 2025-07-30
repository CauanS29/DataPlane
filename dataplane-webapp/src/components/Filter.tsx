import React from 'react';
import { filterConfigs, arrayToOptions, FilterIds } from '../data/filterConfig';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { Spin, Select, Button } from 'antd';
import { LoadingOutlined, ClearOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';

interface FilterProps {
  totalRecords: number;
  onFilterChange?: (filterId: string, value: string | string[]) => void;
}

export const Filter: React.FC<FilterProps> = ({ totalRecords, onFilterChange }) => {
  const { options, loading, error } = useFilterOptions();
  const { filters } = useAppStore();

  // Define which filters should have search
  const filtersWithSearch = ['city', 'aircraft_operator', 'aircraft_model', 'occurrence_type', 'aircraft_manufacturer', 'operation_phase'];

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    if (filterId === 'state') {
      // Reset city when state changes
      onFilterChange?.('city', '');
    }
    onFilterChange?.(filterId, value);
  };

  const getFilteredOptions = (filterId: string, originalOptions: string[]) => {
    let filteredOptions = originalOptions;

    // Filter cities based on selected state
    if (filterId === 'city' && filters['state']) {
      const selectedStates = Array.isArray(filters['state']) ? filters['state'] : [filters['state']];
      console.log('Filtrando cidades para os estados:', selectedStates);
      console.log('Cidades disponíveis:', originalOptions);
      // Tenta diferentes formatos de separador
      filteredOptions = originalOptions.filter(city => 
        selectedStates.some(state => 
          city.includes(` - ${state}`) || // Formato "Cidade - UF"
          city.includes(`-${state}`) ||   // Formato "Cidade-UF"
          city.includes(`/${state}`) ||   // Formato "Cidade/UF"
          city.endsWith(state)            // Formato "CidadeUF"
        )
      );
      console.log('Cidades filtradas:', filteredOptions);
    }

    return arrayToOptions(filteredOptions, true).map(option => ({
      label: option.label,
      value: option.value
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  if (error || !options) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">
            Erro ao carregar filtros. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Resumo dos Filtros Ativos */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Filtros Ativos</h4>
        <div className="text-sm text-blue-700">
          <p>Total de registros: <span className="font-bold">{totalRecords || 0}</span></p>
        </div>
      </div>

      {/* Botão Limpar Filtros */}
      <div className="flex justify-end">
                  <Button 
            icon={<ClearOutlined />}
            onClick={() => {

              // Limpa todos os selects
              const selectElements = document.querySelectorAll('.ant-select');
              selectElements.forEach((select) => {
                const element = select as HTMLElement;
                if (element.classList.contains('ant-select-focused')) {
                  element.blur();
                }
                const input = element.querySelector('input');
                if (input) {
                  input.blur();
                }
              });
              // Limpa os filtros no store
              filterConfigs.forEach(filter => {
                onFilterChange?.(filter.id, '');
              });
            }}
          >
            Limpar Filtros
          </Button>
      </div>

      {/* Filtros dinâmicos */}
      {filterConfigs.map((filter) => (
        <div key={filter.id} className="relative">
          <label className="block text-sm font-medium text-black mb-2">
            {filter.label}
          </label>
          
          <Select
            showSearch={filtersWithSearch.includes(filter.id)}
            placeholder={`Selecione ${filter.label.toLowerCase()}`}
            onChange={(value) => handleFilterChange(filter.id, value)}
            disabled={filter.id === 'city' && (!filters['state'] || (Array.isArray(filters['state']) && filters['state'].length === 0))}
            value={filters[filter.id] || undefined}
            options={getFilteredOptions(filter.id, options.filter_options[FilterIds[filter.id]])}
            className="w-full"
            allowClear
            mode={filter.id === 'state' ? 'multiple' : undefined}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          
          {filter.id === 'city' && (!filters['state'] || (Array.isArray(filters['state']) && filters['state'].length === 0)) && (
            <p className="mt-1 text-sm text-gray-500">Selecione um estado primeiro</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Filter;