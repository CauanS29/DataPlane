import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.middleware import setup_cors, LoggingMiddleware
from app.routes import api_router
from app.models.database import mongodb
from app.services.ai_service import ai_service
from app.utils.logger import app_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação"""
    # Startup
    app_logger.info("Iniciando DataPlane API...")
    
    try:
        # Conecta ao MongoDB
        await mongodb.connect()
        app_logger.info("MongoDB conectado")
        
        # Carrega o modelo de IA (opcional - pode ser carregado sob demanda)
        if os.getenv("LOAD_AI_MODEL_ON_STARTUP", "false").lower() == "true":
            app_logger.info("Carregando modelo de IA na inicialização...")
            ai_service.load_model()
        
        app_logger.info("DataPlane API iniciada com sucesso!")
        
    except Exception as e:
        app_logger.error(f"Erro na inicialização: {e}")
        raise
    
    yield
    
    # Shutdown
    app_logger.info("Encerrando DataPlane API...")
    try:
        # Desconecta do MongoDB
        await mongodb.disconnect()
        app_logger.info("MongoDB desconectado")
        
        # Descarrega o modelo de IA
        ai_service.unload_model()
        app_logger.info("Modelo de IA descarregado")
    except Exception as e:
        app_logger.error(f"Erro ao encerrar: {e}")


# Cria a aplicação FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para processamento de dados com IA pré-treinada",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configura middlewares
setup_cors(app)
app.add_middleware(LoggingMiddleware)

# Inclui as rotas da API
app.include_router(api_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global para exceções não tratadas"""
    app_logger.error(f"Exceção não tratada: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "detail": str(exc) if settings.DEBUG else "Ocorreu um erro inesperado"
        }
    )


@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "Bem-vindo à DataPlane API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )