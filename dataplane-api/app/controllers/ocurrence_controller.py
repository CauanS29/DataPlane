from fastapi import APIRouter, Query, HTTPException
from app.services.ocurrence_service import OcurrenceService
from app.models.schemas import OcurrenceCoordinatesResponse
from app.utils.logger import app_logger


ocurrence_router = APIRouter(prefix="/ocurrence", tags=["ocurrence"])


@ocurrence_router.get("/")
async def get_ocurrence():
    return {"message": "Ocurrence"}


@ocurrence_router.get("/coordinates", response_model=OcurrenceCoordinatesResponse)
async def get_ocurrences_coordinates(
    limit: int = Query(default=1000, ge=1, le=5000, description="Número máximo de ocorrências para retornar"),
    skip: int = Query(default=0, ge=0, description="Número de ocorrências para pular (paginação)")
):
    
    try:
        app_logger.info(f"Buscando coordenadas de ocorrências: limit={limit}, skip={skip}")
        
        # Busca as ocorrências com coordenadas
        ocurrences = await OcurrenceService.get_ocurrences_with_coordinates(limit=limit, skip=skip)
        
        # Conta o total de ocorrências com coordenadas
        total = await OcurrenceService.count_ocurrences_with_coordinates()
        
        response = OcurrenceCoordinatesResponse(
            total=total,
            ocurrences=ocurrences
        )
        
        app_logger.info(f"Retornando {len(ocurrences)} ocorrências de um total de {total}")
        return response
        
    except Exception as e:
        app_logger.error(f"Erro ao buscar coordenadas de ocorrências: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor ao buscar coordenadas de ocorrências: {str(e)}"
        )
from fastapi import APIRouter, Query, HTTPException
from app.services.ocurrence_service import OcurrenceService
from app.models.schemas import OcurrenceCoordinatesResponse
from app.utils.logger import app_logger


ocurrence_router = APIRouter(prefix="/ocurrence", tags=["ocurrence"])


@ocurrence_router.get("/")
async def get_ocurrence():
    return {"message": "Ocurrence"}


@ocurrence_router.get("/coordinates", response_model=OcurrenceCoordinatesResponse)
async def get_ocurrences_coordinates(
    limit: int = Query(default=20000, ge=1, le=20000, description="Número máximo de ocorrências para retornar"),
    skip: int = Query(default=0, ge=0, description="Número de ocorrências para pular (paginação)")
):
    
    try:
        app_logger.info(f"Buscando coordenadas de ocorrências: limit={limit}, skip={skip}")
        
        # Busca as ocorrências com coordenadas
        ocurrences = await OcurrenceService.get_ocurrences_with_coordinates(limit=limit, skip=skip)
        
        # Conta o total de ocorrências com coordenadas
        total = await OcurrenceService.count_ocurrences_with_coordinates()
        
        response = OcurrenceCoordinatesResponse(
            total=total,
            ocurrences=ocurrences
        )
        
        app_logger.info(f"Retornando {len(ocurrences)} ocorrências de um total de {total}")
        return response
        
    except Exception as e:
        app_logger.error(f"Erro ao buscar coordenadas de ocorrências: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor ao buscar coordenadas de ocorrências: {str(e)}"
        )