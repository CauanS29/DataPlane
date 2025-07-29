from typing import List, Optional
from app.models.database import get_collection
from app.models.schemas import OcurrenceCoordinates
from app.utils.logger import app_logger


class OcurrenceService:
    """Serviço para gerenciar ocorrências"""
    
    @staticmethod
    async def get_ocurrences_with_coordinates(limit: int = 1000, skip: int = 0) -> List[OcurrenceCoordinates]:
   
        try:
            collection = await get_collection("ocorrencia")
            
            query = {
                "ocorrencia_latitude": {"$ne": None, "$exists": True},
                "ocorrencia_longitude": {"$ne": None, "$exists": True},
                "$and": [
                    {"ocorrencia_latitude": {"$gte": -90, "$lte": 90}},
                    {"ocorrencia_longitude": {"$gte": -180, "$lte": 180}},
                    {"ocorrencia_latitude": {"$ne": 0}},
                    {"ocorrencia_longitude": {"$ne": 0}}
                ]
            }
            
            projection = {
                "codigo_ocorrencia": 1,
                "ocorrencia_latitude": 1,
                "ocorrencia_longitude": 1,
                "ocorrencia_cidade": 1,
                "ocorrencia_uf": 1,
                "ocorrencia_classificacao": 1,
                "ocorrencia_dia": 1,
                "_id": 0
            }
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            documents = await cursor.to_list(length=limit)
            
            ocurrences = []
            for doc in documents:
                try:
                    if isinstance(doc.get("ocorrencia_latitude"), (int, float, str)):
                        doc["ocorrencia_latitude"] = float(doc["ocorrencia_latitude"])
                    if isinstance(doc.get("ocorrencia_longitude"), (int, float, str)):
                        doc["ocorrencia_longitude"] = float(doc["ocorrencia_longitude"])
                    
                    ocorrencia = OcurrenceCoordinates(**doc)
                    ocurrences.append(ocorrencia)
                except Exception as e:
                    app_logger.warning(f"Erro ao processar ocorrência {doc.get('codigo_ocorrencia', 'unknown')}: {e}")
                    continue
            
            app_logger.info(f"Encontradas {len(ocurrences)} ocorrências com coordenadas")
            return ocurrences
            
        except Exception as e:
            app_logger.error(f"Erro ao buscar ocorrências com coordenadas: {e}")
            raise
    
    @staticmethod
    async def count_ocurrences_with_coordinates() -> int:
        """
        Conta o total de ocorrências que possuem coordenadas válidas
        
        Returns:
            Número total de ocorrências com coordenadas
        """
        try:
            collection = await get_collection("ocorrencia")
            
            query = {
                "ocorrencia_latitude": {"$ne": None, "$exists": True},
                "ocorrencia_longitude": {"$ne": None, "$exists": True},
                "$and": [
                    {"ocorrencia_latitude": {"$gte": -90, "$lte": 90}},
                    {"ocorrencia_longitude": {"$gte": -180, "$lte": 180}},
                    {"ocorrencia_latitude": {"$ne": 0}},
                    {"ocorrencia_longitude": {"$ne": 0}}
                ]
            }
            
            count = await collection.count_documents(query)
            return count
            
        except Exception as e:
            app_logger.error(f"Erro ao contar ocorrências com coordenadas: {e}")
            raise
