from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.settings import settings
from app.utils.logger import app_logger

security = HTTPBearer()


class APITokenMiddleware:
    """Middleware para verificação de API token"""
    
    @staticmethod
    async def verify_api_token(request: Request, credentials: HTTPAuthorizationCredentials = None):
        """Verifica se o API token está correto"""
        
        # Se não há credenciais, retorna erro
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API token necessário",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # Verifica se o token está correto
            if credentials.credentials != settings.API_TOKEN:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API token inválido",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Adiciona informação de autenticação à requisição
            request.state.authenticated = True
            app_logger.info(f"Requisição autenticada: {request.method} {request.url}")
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            app_logger.error(f"Erro na verificação do API token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Erro na autenticação",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    async def require_api_token(request: Request, credentials: HTTPAuthorizationCredentials = None):
        """Middleware que requer API token"""
        return await APITokenMiddleware.verify_api_token(request, credentials) 