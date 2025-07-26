from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.config.settings import settings
from app.utils.logger import app_logger
from datetime import datetime
import asyncio


class MongoDB:
    """Classe para gerenciar conexão com MongoDB"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
    
    async def connect(self):
        """Conecta ao MongoDB"""
        try:
            # Usa a string de conexão com autenticação
            connection_string = settings.mongodb_connection_string
            app_logger.info(f"Conectando ao MongoDB: {connection_string.replace(settings.MONGODB_PASSWORD or '', '***') if settings.MONGODB_PASSWORD else connection_string}")
            
            self.client = AsyncIOMotorClient(connection_string)
            self.database = self.client[settings.MONGODB_DB]
            
            # Testa a conexão
            await self.client.admin.command('ping')
            app_logger.info("Conectado ao MongoDB com sucesso")
            
        except Exception as e:
            app_logger.error(f"Erro ao conectar ao MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Desconecta do MongoDB"""
        if self.client:
            self.client.close()
            app_logger.info("Desconectado do MongoDB")
    
    async def get_collection(self, collection_name: str):
        """Obtém uma coleção do MongoDB"""
        if not self.database:
            await self.connect()
        return self.database[collection_name]


# Instância global do MongoDB
mongodb = MongoDB()


async def get_database():
    """Dependency para obter conexão com o banco"""
    if not mongodb.database:
        await mongodb.connect()
    return mongodb.database


async def get_collection(collection_name: str):
    """Dependency para obter uma coleção"""
    return await mongodb.get_collection(collection_name)


# Funções para operações comuns no MongoDB
async def save_ai_request(collection, ai_request_data: dict):
    """Salva uma requisição de IA no MongoDB"""
    try:
        result = await collection.insert_one(ai_request_data)
        return str(result.inserted_id)
    except Exception as e:
        app_logger.error(f"Erro ao salvar requisição de IA: {e}")
        raise


async def get_ai_requests_history(collection, limit: int = 50, skip: int = 0):
    """Obtém histórico de requisições de IA"""
    try:
        cursor = collection.find().sort("created_at", -1).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        return documents
    except Exception as e:
        app_logger.error(f"Erro ao obter histórico de IA: {e}")
        raise


async def get_ai_request_by_id(collection, request_id: str):
    """Obtém uma requisição específica por ID"""
    try:
        from bson import ObjectId
        document = await collection.find_one({"_id": ObjectId(request_id)})
        return document
    except Exception as e:
        app_logger.error(f"Erro ao obter requisição por ID: {e}")
        raise


async def delete_ai_request(collection, request_id: str):
    """Deleta uma requisição por ID"""
    try:
        from bson import ObjectId
        result = await collection.delete_one({"_id": ObjectId(request_id)})
        return result.deleted_count > 0
    except Exception as e:
        app_logger.error(f"Erro ao deletar requisição: {e}")
        raise 