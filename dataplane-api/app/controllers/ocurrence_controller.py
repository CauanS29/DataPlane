from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.ocurrence_service import OcurrenceService
from app.services.merged_ocurrence_service import MergedOcurrenceService
from app.services.filter_options_service import FilterOptionsService
from app.utils.logger import app_logger


ocurrence_router = APIRouter(prefix="/ocurrence", tags=["ocurrence"])


@ocurrence_router.get("/")
async def get_ocurrence():
    return {"message": "Ocurrence"}


@ocurrence_router.get("/coordinates")
async def get_ocurrences_coordinates(
    limit: int = Query(default=20000, ge=1, le=20000, description="Número máximo de ocorrências para retornar"),
    skip: int = Query(default=0, ge=0, description="Número de ocorrências para pular (paginação)"),
    complete: bool = Query(default=False, description="Se True, retorna dados completos da collection mesclada (aeronaves + tipos + fatores + recomendações)"),
    
    # Filtros básicos de ocorrência
    states: Optional[List[str]] = Query(default=None, description="Estados para filtrar (ex: SP,RJ,MG)"),
    cities: Optional[List[str]] = Query(default=None, description="Cidades para filtrar"),
    classifications: Optional[List[str]] = Query(default=None, description="Classificações de ocorrência para filtrar"),
    countries: Optional[List[str]] = Query(default=None, description="Países para filtrar"),
    
    # Filtros de aeronave (só funcionam com complete=true)
    aircraft_manufacturers: Optional[List[str]] = Query(default=None, description="Fabricantes de aeronaves para filtrar"),
    aircraft_types: Optional[List[str]] = Query(default=None, description="Tipos de aeronaves para filtrar"),
    damage_levels: Optional[List[str]] = Query(default=None, description="Níveis de dano para filtrar"),
    
    # Filtros de data
    date_start: Optional[str] = Query(default=None, description="Data inicial (formato YYYY-MM-DD)"),
    date_end: Optional[str] = Query(default=None, description="Data final (formato YYYY-MM-DD)")
):
    """
    Busca ocorrências com coordenadas válidas com filtros customizados
    
    - **limit**: Número máximo de ocorrências para retornar (1-20000)
    - **skip**: Número de ocorrências para pular (paginação)  
    - **complete**: Se True, retorna dados COMPLETOS da collection mesclada
    
    ### Filtros disponíveis:
    - **Básicos**: states, cities, classifications, countries, date_start, date_end
    - **Aeronaves** (apenas com complete=true): aircraft_manufacturers, aircraft_types, damage_levels
    
    ### Modos de uso:
    - `complete=false` (padrão): Dados básicos de ocorrências apenas (filtros básicos)
    - `complete=true`: Dados completos + filtros de aeronaves
    
    ### Exemplos:
    - `/coordinates?states=SP,RJ&date_start=2020-01-01`
    - `/coordinates?complete=true&aircraft_manufacturers=BOEING,AIRBUS`
    """
    try:
        # Se complete=true, usa a collection mesclada com TODOS os dados
        if complete:
            app_logger.info(f"Buscando dados COMPLETOS mesclados: limit={limit}, skip={skip}")
            
            # Busca da collection mesclada (dados completos)
            ocurrences = await MergedOcurrenceService.get_merged_ocurrences_with_coordinates(
                limit=limit, 
                skip=skip,
                states=states,
                cities=cities,
                classifications=classifications,
                countries=countries,
                aircraft_manufacturers=aircraft_manufacturers,
                aircraft_types=aircraft_types,
                damage_levels=damage_levels,
                date_start=date_start,
                date_end=date_end
            )
            
            # Conta total da collection mesclada
            total = await MergedOcurrenceService.count_merged_ocurrences_with_coordinates(
                states=states,
                cities=cities,
                classifications=classifications,
                countries=countries,
                aircraft_manufacturers=aircraft_manufacturers,
                aircraft_types=aircraft_types,
                damage_levels=damage_levels,
                date_start=date_start,
                date_end=date_end
            )
            
            # Obtém estatísticas
            stats = await MergedOcurrenceService.get_merged_stats()
            
            response = {
                "total": total,
                "ocurrences": ocurrences,
                "complete": True,
                "data_source": "merged_collection",
                "stats": stats,
                "description": "Dados completos com aeronaves, tipos, fatores e recomendações"
            }
            
        else:
            # Modo básico: dados de ocorrências apenas
            app_logger.info(f"Buscando coordenadas básicas: limit={limit}, skip={skip}")
            
            # Busca as ocorrências com coordenadas (dados básicos)
            ocurrences = await OcurrenceService.get_ocurrences_with_coordinates(
                limit=limit, 
                skip=skip,
                states=states,
                cities=cities,
                classifications=classifications,
                countries=countries,
                date_start=date_start,
                date_end=date_end
            )
            
            # Conta o total de ocorrências com coordenadas
            total = await OcurrenceService.count_ocurrences_with_coordinates(
                states=states,
                cities=cities,
                classifications=classifications,
                countries=countries,
                date_start=date_start,
                date_end=date_end
            )
            
            response = {
                "total": total,
                "ocurrences": ocurrences,
                "complete": False,
                "data_source": "separate_collections",
                "description": "Dados básicos de ocorrências"
            }
        
        app_logger.info(f"Retornando {len(ocurrences)} ocorrências de um total de {total}")
        return response
        
    except Exception as e:
        app_logger.error(f"Erro ao buscar coordenadas de ocorrências: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor ao buscar coordenadas de ocorrências: {str(e)}"
        )


@ocurrence_router.get("/filter-options")
async def get_filter_options(
    category: Optional[str] = Query(default=None, description="Categoria específica do filtro (opcional)")
):
    """
    Retorna opções disponíveis para filtros/selects
    
    - **category** (opcional): Se especificado, retorna apenas as opções dessa categoria
    - **Sem category**: Retorna todas as opções organizadas por categoria
    
    ### Categorias disponíveis:
    - **Básicas**: states, cities, classifications, countries, aerodromes
    - **Aeronaves**: aircraft_manufacturers, aircraft_types, aircraft_models, damage_levels
    - **Operação**: aircraft_operators, operation_phases, operation_types
    - **Investigação**: investigation_status, aircraft_released
    - **Tipos**: occurrence_types, occurrence_type_categories
    - **Fatores**: factor_names, factor_aspects, factor_areas
    
    ### Exemplos:
    - `/filter-options` - Retorna todas as opções
    - `/filter-options?category=states` - Retorna apenas estados
    - `/filter-options?category=aircraft_manufacturers` - Retorna apenas fabricantes
    """
    try:
        # Se category foi especificada, retorna apenas essa categoria
        if category:
            app_logger.info(f"Buscando opções para categoria específica: {category}")
            
            options = await FilterOptionsService.get_filter_options_by_category(category)
            
            if not options:
                return {
                    "category": category,
                    "options": [],
                    "count": 0,
                    "message": f"Nenhuma opção encontrada para a categoria '{category}'"
                }
            
            return {
                "category": category,
                "options": options,
                "count": len(options)
            }
        
        # Se não especificou category, retorna todas as opções
        else:
            app_logger.info("Buscando todas as opções de filtros")
            result = await FilterOptionsService.get_all_filter_options()
            return result
        
    except Exception as e:
        error_msg = f"Erro ao buscar opções de filtros"
        if category:
            error_msg += f" para categoria {category}"
        
        app_logger.error(f"{error_msg}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor ao buscar opções de filtros: {str(e)}"
        )


@ocurrence_router.get("/stats")
async def get_merged_stats():
    """
    Retorna estatísticas da collection de dados mesclados
    
    Fornece informações sobre:
    - Total de ocorrências
    - Quantidade com coordenadas
    - Quantidade com dados de aeronaves
    - Quantidade com recomendações
    - Percentual de completude dos dados
    """
    try:
        app_logger.info("Buscando estatísticas da collection mesclada")
        
        stats = await MergedOcurrenceService.get_merged_stats()
        
        app_logger.info(f"Estatísticas obtidas: {stats}")
        return {
            "statistics": stats,
            "data_source": "merged_collection"
        }
        
    except Exception as e:
        app_logger.error(f"Erro ao buscar estatísticas: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor ao buscar estatísticas: {str(e)}"
        )