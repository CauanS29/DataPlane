import sys
import os
from loguru import logger
from app.config.settings import settings


def setup_logger():
    """Configura o sistema de logging da aplicação"""
    
    # Remove o logger padrão
    logger.remove()
    
    # Cria o diretório de logs se não existir
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    
    # Configura o logger para console
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True
    )
    
    # Configura o logger para arquivo
    logger.add(
        settings.LOG_FILE,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )
    
    return logger


# Instância global do logger
app_logger = setup_logger() 