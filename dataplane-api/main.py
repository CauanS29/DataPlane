import uvicorn
from fastapi import FastAPI
from app.routes.api_router import api_router
from app.middleware.logging import LoggingMiddleware
from app.middleware.cors import setup_cors
from app.utils.logger import logger
from app.services.ai_service import ai_service
from app.config.settings import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG
)

# Configuração de CORS
setup_cors(app)

# Adiciona o middleware de logging
app.add_middleware(LoggingMiddleware)

# Adiciona as rotas da API
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """
    Funções a serem executadas na inicialização da aplicação.
    """
    logger.info("🚀 Iniciando a aplicação...")
    if settings.LOAD_AI_MODEL_ON_STARTUP:
        logger.info("🧠 Carregando modelo de IA...")
        ai_service.load_model()
        logger.info("✅ Modelo de IA carregado com sucesso!")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Funções a serem executadas no encerramento da aplicação.
    """
    logger.info("🔌 Encerrando a aplicação...")

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.DEBUG
    )