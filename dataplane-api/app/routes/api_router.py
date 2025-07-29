from fastapi import APIRouter
from app.controllers import health_router, ai_router, ocurrence_router
from app.config.settings import settings

# Cria o roteador principal da API
api_router = APIRouter()

# Inclui todos os roteadores
api_router.include_router(health_router)
api_router.include_router(ai_router) 
api_router.include_router(ocurrence_router)