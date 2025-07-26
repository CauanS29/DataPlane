from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Configurações da API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DataPlane API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Configurações de segurança
    API_TOKEN: str = "your-api-token-here"
    
    # Configurações do MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "dataplane"
    MONGODB_USERNAME: Optional[str] = None
    MONGODB_PASSWORD: Optional[str] = None
    MONGODB_AUTH_SOURCE: str = "admin"
    
    # Configurações da IA
    AI_MODEL_PATH: str = "./models/checkpoint"
    AI_MODEL_NAME: str = "gpt2"
    AI_MAX_LENGTH: int = 512
    AI_TEMPERATURE: float = 0.7
    
    # Configurações de CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # Configurações de logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    @property
    def mongodb_connection_string(self) -> str:
        """Gera a string de conexão do MongoDB com autenticação"""
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            # Remove mongodb:// do início se existir
            base_url = self.MONGODB_URL.replace("mongodb://", "")
            return f"mongodb://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}@{base_url}/{self.MONGODB_DB}?authSource={self.MONGODB_AUTH_SOURCE}"
        else:
            return f"{self.MONGODB_URL}/{self.MONGODB_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instância global das configurações
settings = Settings() 