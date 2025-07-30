from typing import List, Dict, Any
from app.models.database import get_collection
from app.utils.logger import app_logger


class FilterOptionsService:
    """Serviço para buscar opções de filtros da collection mesclada"""
    
    @staticmethod
    async def get_distinct_values(field_name: str, limit: int = 1000) -> List[str]:
        """
        Busca valores únicos para um campo específico
        
        Args:
            field_name: Nome do campo no MongoDB
            limit: Limite máximo de valores a retornar
            
        Returns:
            Lista de valores únicos limpos e ordenados
        """
        try:
            collection = await get_collection("ocorrencia_completa")
            
            # Pipeline de aggregation para buscar valores únicos
            pipeline = [
                {"$match": {field_name: {"$exists": True, "$ne": None, "$ne": ""}}},
                {"$group": {"_id": f"${field_name}"}},
                {"$sort": {"_id": 1}},
                {"$limit": limit}
            ]
            
            cursor = collection.aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            
            # Extrai os valores e limpa dados inválidos
            values = []
            for result in results:
                value = result["_id"]
                if value and isinstance(value, str):
                    cleaned = value.strip()
                    if cleaned and cleaned.lower() not in ['nan', 'null', '***', 'none', '-', 'n/a']:
                        values.append(cleaned)
                elif value and not isinstance(value, str):
                    values.append(str(value))
            
            return sorted(list(set(values)))  # Remove duplicatas e ordena
            
        except Exception as e:
            app_logger.warning(f"Erro ao buscar valores para {field_name}: {e}")
            return []
    
    @staticmethod
    async def get_all_filter_options() -> Dict[str, Any]:
        """
        Busca todas as opções disponíveis para filtros
        
        Returns:
            Dicionário com todas as opções de filtros organizadas por categoria
        """
        try:
            app_logger.info("Buscando todas as opções de filtros da collection mesclada")
            
            # Busca opções para todos os campos de filtro em paralelo
            filter_options = {
                # Filtros básicos de ocorrência
                "states": await FilterOptionsService.get_distinct_values("ocorrencia_uf"),
                "cities": await FilterOptionsService.get_distinct_values("ocorrencia_cidade", 500),
                "classifications": await FilterOptionsService.get_distinct_values("ocorrencia_classificacao"),
                "countries": await FilterOptionsService.get_distinct_values("ocorrencia_pais"),
                "aerodromes": await FilterOptionsService.get_distinct_values("ocorrencia_aerodromo", 300),
                
                # Filtros de aeronave
                "aircraft_manufacturers": await FilterOptionsService.get_distinct_values("aeronave_fabricante"),
                "aircraft_types": await FilterOptionsService.get_distinct_values("aeronave_tipo_veiculo"),
                "aircraft_models": await FilterOptionsService.get_distinct_values("aeronave_modelo", 200),
                "damage_levels": await FilterOptionsService.get_distinct_values("aeronave_nivel_dano"),
                "aircraft_operators": await FilterOptionsService.get_distinct_values("aeronave_operador_categoria"),
                "operation_phases": await FilterOptionsService.get_distinct_values("aeronave_fase_operacao"),
                "operation_types": await FilterOptionsService.get_distinct_values("aeronave_tipo_operacao"),
                
                # Filtros de investigação
                "investigation_status": await FilterOptionsService.get_distinct_values("investigacao_status"),
                "aircraft_released": await FilterOptionsService.get_distinct_values("investigacao_aeronave_liberada"),
                
                # Filtros de tipos de ocorrência
                "occurrence_types": await FilterOptionsService.get_distinct_values("ocorrencia_tipo"),
                "occurrence_type_categories": await FilterOptionsService.get_distinct_values("ocorrencia_tipo_categoria"),
                
                # Filtros de fatores contribuintes
                "factor_names": await FilterOptionsService.get_distinct_values("fator_nome", 200),
                "factor_aspects": await FilterOptionsService.get_distinct_values("fator_aspecto"),
                "factor_areas": await FilterOptionsService.get_distinct_values("fator_area")
            }
            
            # Calcula estatísticas
            total_options = sum(len(options) for options in filter_options.values())
            
            result = {
                "filter_options": filter_options,
                "metadata": {
                    "total_unique_options": total_options,
                    "fields_available": len(filter_options),
                    "data_source": "ocorrencia_completa",
                    "note": "Valores limpos e ordenados alfabeticamente"
                }
            }
            
            app_logger.info(f"Opções de filtros obtidas: {total_options} valores únicos em {len(filter_options)} campos")
            return result
            
        except Exception as e:
            app_logger.error(f"Erro ao buscar opções de filtros: {e}")
            raise
    
    @staticmethod
    async def get_filter_options_by_category(category: str) -> List[str]:
        """
        Busca opções de filtro para uma categoria específica
        
        Args:
            category: Categoria do filtro (ex: 'states', 'aircraft_manufacturers')
            
        Returns:
            Lista de valores únicos para a categoria
        """
        try:
            # Mapeamento de categorias para campos do MongoDB
            field_mapping = {
                "states": "ocorrencia_uf",
                "cities": "ocorrencia_cidade",
                "classifications": "ocorrencia_classificacao", 
                "countries": "ocorrencia_pais",
                "aerodromes": "ocorrencia_aerodromo",
                "aircraft_manufacturers": "aeronave_fabricante",
                "aircraft_types": "aeronave_tipo_veiculo",
                "aircraft_models": "aeronave_modelo",
                "damage_levels": "aeronave_nivel_dano",
                "aircraft_operators": "aeronave_operador_categoria",
                "operation_phases": "aeronave_fase_operacao",
                "operation_types": "aeronave_tipo_operacao",
                "investigation_status": "investigacao_status",
                "aircraft_released": "investigacao_aeronave_liberada",
                "occurrence_types": "ocorrencia_tipo",
                "occurrence_type_categories": "ocorrencia_tipo_categoria",
                "factor_names": "fator_nome",
                "factor_aspects": "fator_aspecto",
                "factor_areas": "fator_area"
            }
            
            if category not in field_mapping:
                app_logger.warning(f"Categoria não encontrada: {category}")
                return []
            
            field_name = field_mapping[category]
            
            # Define limites específicos para alguns campos
            limits = {
                "ocorrencia_cidade": 500,
                "ocorrencia_aerodromo": 300,
                "aeronave_modelo": 200,
                "fator_nome": 200
            }
            
            limit = limits.get(field_name, 1000)
            
            return await FilterOptionsService.get_distinct_values(field_name, limit)
            
        except Exception as e:
            app_logger.error(f"Erro ao buscar opções para categoria {category}: {e}")
            raise