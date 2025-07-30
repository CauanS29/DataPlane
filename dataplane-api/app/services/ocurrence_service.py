from typing import List, Optional, Union
from app.models.database import get_collection
from app.models.schemas import OcurrenceCoordinates, OcurrenceWithAeronave, AeronaveData
from app.utils.logger import app_logger


class OcurrenceService:
    """Serviço para gerenciar ocorrências"""
    
    @staticmethod
    async def get_ocurrences_with_coordinates(limit: int = 20000, skip: int = 0) -> List[OcurrenceCoordinates]:
   
        try:
            collection = await get_collection("ocorrencia")
            
            # Query otimizada para filtrar coordenadas válidas no MongoDB
            query = {
                "ocorrencia_latitude": {"$exists": True, "$ne": None},
                "ocorrencia_longitude": {"$exists": True, "$ne": None}
            }
            
            app_logger.info(f"Executando query com limit: {limit}, skip: {skip}")
            
            projection = {
                "codigo_ocorrencia": 1,
                "ocorrencia_latitude": 1,
                "ocorrencia_longitude": 1,
                "ocorrencia_cidade": 1,
                "ocorrencia_uf": 1,
                "ocorrencia_classificacao": 1,
                "ocorrencia_dia": 1,
                "ocorrencia_pais": 1,
                "ocorrencia_aerodromo": 1,
                "ocorrencia_hora": 1,
                "investigacao_aeronave_liberada": 1,
                "investigacao_status": 1,
                "divulgacao_relatorio_numero": 1,
                "divulgacao_relatorio_publicado": 1,
                "divulgacao_dia_publicacao": 1,
                "total_recomendacoes": 1,
                "total_aeronaves_envolvidas": 1,
                "ocorrencia_saida_pista": 1,
                "_id": 0
            }
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            documents = await cursor.to_list(length=limit)
            
            app_logger.info(f"Documentos encontrados: {len(documents)}")
            
            ocurrences = []
            invalid_count = 0
            
            for doc in documents:
                try:
                    # Processamento otimizado das coordenadas
                    lat = doc.get("ocorrencia_latitude")
                    lon = doc.get("ocorrencia_longitude")
                    
                    # Converte coordenadas para float se necessário
                    if isinstance(lat, str):
                        lat = float(lat.replace(",", "."))
                    if isinstance(lon, str):
                        lon = float(lon.replace(",", "."))
                    
                    doc["ocorrencia_latitude"] = float(lat)
                    doc["ocorrencia_longitude"] = float(lon)
                    
                    # Converte codigo_ocorrencia para string se necessário
                    if isinstance(doc.get("codigo_ocorrencia"), (int, float)):
                        doc["codigo_ocorrencia"] = str(doc["codigo_ocorrencia"])
                    
                    # Converte campos numéricos se necessário
                    for field in ["total_recomendacoes", "total_aeronaves_envolvidas"]:
                        if field in doc and doc[field] is not None:
                            try:
                                doc[field] = int(doc[field])
                            except (ValueError, TypeError):
                                doc[field] = None
                    
                    ocorrencia = OcurrenceCoordinates(**doc)
                    ocurrences.append(ocorrencia)
                    
                except Exception as e:
                    invalid_count += 1
                    if invalid_count <= 10:  # Log apenas os primeiros 10 erros
                        app_logger.warning(f"Erro ao processar ocorrência {doc.get('codigo_ocorrencia', 'unknown')}: {e}")
                    continue
            
            app_logger.info(f"Processamento concluído - Válidos: {len(ocurrences)}, Inválidos: {invalid_count}")
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
                "ocorrencia_latitude": {"$exists": True, "$ne": None},
                "ocorrencia_longitude": {"$exists": True, "$ne": None}
            }
            
            count = await collection.count_documents(query)
            return count
            
        except Exception as e:
            app_logger.error(f"Erro ao contar ocorrências com coordenadas: {e}")
            raise
