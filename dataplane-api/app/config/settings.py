from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Classe de configurações para a aplicação.
    Lê as variáveis de ambiente de um arquivo .env.
    """
    # Configurações da API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DataPlane API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Configurações de segurança
    API_TOKEN: str

    # Configurações do MongoDB
    MONGODB_URL: str = "mongodb://host.docker.internal:27017"
    MONGODB_DB: str
    MONGODB_USERNAME: str
    MONGODB_PASSWORD: str
    MONGODB_AUTH_SOURCE: str = "admin"

    # Configurações da IA
    AI_MODEL_PATH: str = "./models/checkpoint"
    AI_MODEL_NAME: str = "gpt2"
    AI_MAX_LENGTH: int = 512
    AI_TEMPERATURE: float = 0.7
    LOAD_AI_MODEL_ON_STARTUP: bool = False

    # Configurações de CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Configurações de logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    @property
    def mongodb_connection_string(self) -> str:
        """Gera a string de conexão do MongoDB com autenticação"""
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            return f"mongodb://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}@{self.MONGODB_URL.replace('mongodb://', '')}"
        else:
            return self.MONGODB_URL

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding='utf-8', 
        extra='ignore',
        protected_namespaces=()
    )

settings = Settings() 