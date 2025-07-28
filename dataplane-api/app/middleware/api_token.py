from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.settings import settings

# Instância do esquema de segurança
security = HTTPBearer()

async def verify_api_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependência para verificar o API token.
    Usa o HTTPBearer para extrair o token e o compara com o token das configurações.
    """
    if credentials.credentials != settings.API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True 