import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import app_logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware para logging de requisições HTTP"""
    
    async def dispatch(self, request: Request, call_next):
        # Tempo de início
        start_time = time.time()
        
        # Log da requisição
        app_logger.info(f"Requisição iniciada: {request.method} {request.url}")
        
        # Processa a requisição
        response = await call_next(request)
        
        # Calcula o tempo de processamento
        process_time = time.time() - start_time
        
        # Log da resposta
        app_logger.info(
            f"Requisição finalizada: {request.method} {request.url} - "
            f"Status: {response.status_code} - "
            f"Tempo: {process_time:.4f}s"
        )
        
        # Adiciona header com tempo de processamento
        response.headers["X-Process-Time"] = str(process_time)
        
        return response 