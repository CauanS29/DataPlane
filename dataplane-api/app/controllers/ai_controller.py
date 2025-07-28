from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.models.database import save_ai_request, get_ai_requests_history, get_ai_requests_collection
from app.models.schemas import AIRequest, AIResponse, ErrorResponse
from app.services.ai_service import ai_service
from app.middleware.api_token import verify_api_token
from app.utils.logger import app_logger

ai_router = APIRouter(prefix="/ai", tags=["ai"])


@ai_router.post("/generate", response_model=AIResponse)
async def generate_text(
    request: AIRequest,
    collection=Depends(get_ai_requests_collection),
    authenticated: bool = Depends(verify_api_token)
):
    """Gera texto usando o modelo de IA"""
    try:
        app_logger.info(f"Requisição de geração de texto recebida: {request.prompt[:50]}...")
        
        # Gera o texto
        response = ai_service.generate_text(request)
        
        # Salva no histórico
        ai_request_data = {
            "prompt": request.prompt,
            "generated_text": response.generated_text,
            "model_name": response.model_name,
            "generation_time": int(response.generation_time * 1000),  # Converte para ms
            "tokens_generated": response.tokens_generated,
            "created_at": response.created_at if hasattr(response, 'created_at') else None
        }
        
        await save_ai_request(collection, ai_request_data)
        
        return response
        
    except Exception as e:
        app_logger.error(f"Erro na geração de texto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na geração de texto: {str(e)}"
        )


@ai_router.get("/model/info")
async def get_model_info(
    authenticated: bool = Depends(verify_api_token)
):
    """Retorna informações sobre o modelo de IA"""
    try:
        return ai_service.get_model_info()
    except Exception as e:
        app_logger.error(f"Erro ao obter informações do modelo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter informações do modelo: {str(e)}"
        )


@ai_router.post("/model/load")
async def load_model(
    authenticated: bool = Depends(verify_api_token)
):
    """Carrega o modelo de IA na memória"""
    try:
        success = ai_service.load_model()
        if success:
            return {"message": "Modelo carregado com sucesso", "status": "loaded"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao carregar o modelo"
            )
    except Exception as e:
        app_logger.error(f"Erro ao carregar modelo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar modelo: {str(e)}"
        )


@ai_router.post("/model/unload")
async def unload_model(
    authenticated: bool = Depends(verify_api_token)
):
    """Descarrega o modelo de IA da memória"""
    try:
        ai_service.unload_model()
        return {"message": "Modelo descarregado com sucesso", "status": "unloaded"}
    except Exception as e:
        app_logger.error(f"Erro ao descarregar modelo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao descarregar modelo: {str(e)}"
        )


@ai_router.get("/history", response_model=list[dict])
async def get_generation_history(
    skip: int = 0,
    limit: int = 50,
    collection=Depends(get_ai_requests_collection),
    authenticated: bool = Depends(verify_api_token)
):
    """Retorna histórico de gerações"""
    try:
        # Busca histórico
        history = await get_ai_requests_history(collection, limit, skip)
        
        # Converte ObjectId para string
        for item in history:
            item["id"] = str(item["_id"])
            del item["_id"]
        
        return history
        
    except Exception as e:
        app_logger.error(f"Erro ao obter histórico: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter histórico: {str(e)}"
        ) 