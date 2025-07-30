export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: keyof typeof FilterIds;
  label: string;
  type: 'select';
  placeholder?: string;
}

// Enum para garantir type-safety nos IDs dos filtros
export const FilterIds = {
  state: 'states',
  city: 'cities',
  classification: 'classifications',
  aircraft_type: 'aircraft_types',
  damage_level: 'damage_levels',
  operation_phase: 'operation_phases',
  operation_type: 'operation_types',
  aircraft_manufacturer: 'aircraft_manufacturers',
  aircraft_model: 'aircraft_models',
  aircraft_operator: 'aircraft_operators',
  investigation_status: 'investigation_status',
  occurrence_type: 'occurrence_types'
} as const;

// Converte array de strings em array de options
export const arrayToOptions = (arr: string[] = [], addEmptyOption = true) => {
  const options = arr.map(item => ({
    value: item,
    label: item
  }));

  if (addEmptyOption) {
    options.unshift({ value: '', label: 'Todos' });
  }

  return options;
};

export const filterConfigs: FilterConfig[] = [
  {
    id: 'state',
    label: 'Estado',
    type: 'select',
    placeholder: 'Selecione o estado'
  },
  {
    id: 'city',
    label: 'Cidade',
    type: 'select',
    placeholder: 'Selecione a cidade'
  },
  {
    id: 'classification',
    label: 'Classificação',
    type: 'select',
    placeholder: 'Selecione a classificação'
  },
  {
    id: 'aircraft_type',
    label: 'Tipo de Aeronave',
    type: 'select',
    placeholder: 'Selecione o tipo'
  },
  {
    id: 'damage_level',
    label: 'Nível de Dano',
    type: 'select',
    placeholder: 'Selecione o nível de dano'
  },
  {
    id: 'operation_phase',
    label: 'Fase de Operação',
    type: 'select',
    placeholder: 'Selecione a fase'
  },
  {
    id: 'operation_type',
    label: 'Tipo de Operação',
    type: 'select',
    placeholder: 'Selecione o tipo de operação'
  },
  {
    id: 'aircraft_manufacturer',
    label: 'Fabricante',
    type: 'select',
    placeholder: 'Selecione o fabricante'
  },
  {
    id: 'aircraft_model',
    label: 'Modelo',
    type: 'select',
    placeholder: 'Selecione o modelo'
  },
  {
    id: 'aircraft_operator',
    label: 'Operador',
    type: 'select',
    placeholder: 'Selecione o operador'
  },
  {
    id: 'investigation_status',
    label: 'Status da Investigação',
    type: 'select',
    placeholder: 'Selecione o status'
  },
  {
    id: 'occurrence_type',
    label: 'Tipo de Ocorrência',
    type: 'select',
    placeholder: 'Selecione o tipo'
  }
];