from fastapi import APIRouter, Query, HTTPException
from app.services.ocurrence_service import OcurrenceService
from app.services.merged_ocurrence_service import MergedOcurrenceService
from app.utils.logger import app_logger


ocurrence_router = APIRouter(prefix="/ocurrence", tags=["ocurrence"])


@ocurrence_router.get("/")
async def get_ocurrence():
    return {"message": "Ocurrence"}


@ocurrence_router.get("/coordinates")
async def get_ocurrences_coordinates(
    limit: int = Query(default=20000, ge=1, le=20000, description="Número máximo de ocorrências para retornar"),
    skip: int = Query(default=0, ge=0, description="Número de ocorrências para pular (paginação)"),
    complete: bool = Query(default=False, description="Se True, retorna dados completos da collection mesclada (aeronaves + tipos + fatores + recomendações)")
):
    """
    Busca ocorrências com coordenadas válidas
    
    - **limit**: Número máximo de ocorrências para retornar (1-20000)
    - **skip**: Número de ocorrências para pular (paginação)  
    - **complete**: Se True, retorna dados COMPLETOS da collection mesclada
    
    ### Modos de uso:
    - `complete=false` (padrão): Dados básicos de ocorrências apenas
    - `complete=true`: Dados completos (aeronaves + tipos + fatores + recomendações)
    """
    try:
        # Se complete=true, usa a collection mesclada com TODOS os dados
        if complete:
            app_logger.info(f"Buscando dados COMPLETOS mesclados: limit={limit}, skip={skip}")
            
            # Busca da collection mesclada (dados completos)
            ocurrences = await MergedOcurrenceService.get_merged_ocurrences_with_coordinates(
                limit=limit, 
                skip=skip
            )
            
            # Conta total da collection mesclada
            total = await MergedOcurrenceService.count_merged_ocurrences_with_coordinates()
            
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
                skip=skip
            )
            
            # Conta o total de ocorrências com coordenadas
            total = await OcurrenceService.count_ocurrences_with_coordinates()
            
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