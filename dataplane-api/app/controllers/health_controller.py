from fastapi import APIRouter, Depends
from app.models.database import get_database
from app.models.schemas import HealthCheck
from app.services.ai_service import ai_service
from app.utils.logger import app_logger

health_router = APIRouter(prefix="/health", tags=["health"])


@health_router.get("/", response_model=HealthCheck)
async def health_check():
    """Endpoint básico de health check"""
    return HealthCheck()


@health_router.get("/detailed")
async def detailed_health_check(db=Depends(get_database)):
    """Health check detalhado com verificação de serviços"""
    health_status = {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "1.0.0",
        "services": {
            "database": "unknown",
            "ai_model": "unknown"
        }
    }
    
    try:
        # Verifica banco de dados MongoDB
        await db.command("ping")
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = "unhealthy"
        health_status["status"] = "unhealthy"
        app_logger.error(f"Erro no health check do banco: {e}")
    
    try:
        # Verifica serviço de IA
        ai_healthy = ai_service.health_check()
        health_status["services"]["ai_model"] = "healthy" if ai_healthy else "unhealthy"
        if not ai_healthy:
            health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["services"]["ai_model"] = "unhealthy"
        health_status["status"] = "unhealthy"
        app_logger.error(f"Erro no health check da IA: {e}")
    
    return health_status


@health_router.get("/ai")
async def ai_health_check():
    """Health check específico do serviço de IA"""
    try:
        is_healthy = ai_service.health_check()
        model_info = ai_service.get_model_info()
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "model_info": model_info,
            "health_check": is_healthy
        }
    except Exception as e:
        app_logger.error(f"Erro no health check da IA: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        } 