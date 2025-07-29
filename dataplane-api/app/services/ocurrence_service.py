from typing import List, Optional
from app.models.database import get_collection
from app.models.schemas import OcurrenceCoordinates
from app.utils.logger import app_logger


class OcurrenceService:
    """Serviço para gerenciar ocorrências"""
    
    @staticmethod
    async def get_ocurrences_with_coordinates(limit: int = 20000, skip: int = 0) -> List[OcurrenceCoordinates]:
   
        try:
            collection = await get_collection("ocorrencia")
            
            # Query simplificada para testar
            query = {
                "ocorrencia_latitude": {"$exists": True, "$ne": None},
                "ocorrencia_longitude": {"$exists": True, "$ne": None}
            }
            
            app_logger.info(f"Query sendo executada: {query}")
            app_logger.info(f"Limit solicitado: {limit}, Skip: {skip}")
            
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
            
            app_logger.info(f"Query executada - documentos encontrados: {len(documents)}")
            app_logger.debug(f"Documentos da query: {documents}")
            
            ocurrences = []
            processed_count = 0
            invalid_lat_count = 0
            invalid_lon_count = 0
            invalid_codigo_count = 0
            validation_error_count = 0
            
            for doc in documents:
                processed_count += 1
                try:
                    app_logger.debug(f"Processando documento: {doc}")
                    
                    # Processa latitude
                    lat = doc.get("ocorrencia_latitude")
                    if lat is not None and lat != "" and str(lat).lower() != "nan":
                        try:
                            lat_float = float(str(lat).replace(",", "."))
                            if -90 <= lat_float <= 90:
                                doc["ocorrencia_latitude"] = lat_float
                            else:
                                app_logger.warning(f"Latitude fora do range válido: {lat_float}")
                                invalid_lat_count += 1
                                continue
                        except (ValueError, TypeError):
                            app_logger.warning(f"Latitude inválida: {lat}")
                            invalid_lat_count += 1
                            continue
                    else:
                        app_logger.warning(f"Latitude vazia ou nula: {lat}")
                        invalid_lat_count += 1
                        continue
                    
                    # Processa longitude
                    lon = doc.get("ocorrencia_longitude")
                    if lon is not None and lon != "" and str(lon).lower() != "nan":
                        try:
                            lon_float = float(str(lon).replace(",", "."))
                            if -180 <= lon_float <= 180:
                                doc["ocorrencia_longitude"] = lon_float
                            else:
                                app_logger.warning(f"Longitude fora do range válido: {lon_float}")
                                invalid_lon_count += 1
                                continue
                        except (ValueError, TypeError):
                            app_logger.warning(f"Longitude inválida: {lon}")
                            invalid_lon_count += 1
                            continue
                    else:
                        app_logger.warning(f"Longitude vazia ou nula: {lon}")
                        invalid_lon_count += 1
                        continue
                    
                    app_logger.debug(f"Documento após conversão: {doc}")
                    
                    # Converte codigo_ocorrencia para string se necessário
                    if isinstance(doc.get("codigo_ocorrencia"), (int, float)):
                        doc["codigo_ocorrencia"] = str(doc["codigo_ocorrencia"])
                    
                    ocorrencia = OcurrenceCoordinates(**doc)
                    ocurrences.append(ocorrencia)
                    app_logger.debug(f"Ocorrência criada com sucesso: {ocorrencia}")
                except Exception as e:
                    app_logger.warning(f"Erro ao processar ocorrência {doc.get('codigo_ocorrencia', 'unknown')}: {e}")
                    app_logger.debug(f"Documento que causou erro: {doc}")
                    validation_error_count += 1
                    continue
            
            app_logger.info(f"Estatísticas de processamento:")
            app_logger.info(f"  - Total processado: {processed_count}")
            app_logger.info(f"  - Latitude inválida: {invalid_lat_count}")
            app_logger.info(f"  - Longitude inválida: {invalid_lon_count}")
            app_logger.info(f"  - Erro de validação: {validation_error_count}")
            app_logger.info(f"  - Válidos: {len(ocurrences)}")
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
                "ocorrencia_latitude": {"$exists": True, "$ne": None},
                "ocorrencia_longitude": {"$exists": True, "$ne": None}
            }
            
            count = await collection.count_documents(query)
            return count
            
        except Exception as e:
            app_logger.error(f"Erro ao contar ocorrências com coordenadas: {e}")
            raise
