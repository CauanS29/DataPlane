from typing import List, Optional
from app.models.database import get_collection
from app.utils.logger import app_logger


class MergedOcurrenceService:
    """Serviço para gerenciar dados mesclados de ocorrências"""
    
    @staticmethod
    async def get_merged_ocurrences_with_coordinates(limit: int = 20000, skip: int = 0) -> List[dict]:
        """
        Busca ocorrências com coordenadas da collection mesclada (com todos os dados)
        
        Args:
            limit: Limite de resultados  
            skip: Número de documentos para pular
            
        Returns:
            Lista de ocorrências completas com todos os dados mesclados
        """
        try:
            collection = await get_collection("ocorrencia_completa")
            
            # Query para ocorrências com coordenadas válidas
            query = {
                "ocorrencia_latitude": {"$exists": True, "$ne": None, "$ne": ""},
                "ocorrencia_longitude": {"$exists": True, "$ne": None, "$ne": ""}
            }
            
            app_logger.info(f"Executando query na collection mesclada - limit: {limit}, skip: {skip}")
            
            # Projection otimizada - inclui todos os campos importantes
            projection = {
                # Dados da ocorrência
                "codigo_ocorrencia": 1,
                "ocorrencia_latitude": 1,
                "ocorrencia_longitude": 1,
                "ocorrencia_cidade": 1,
                "ocorrencia_uf": 1,
                "ocorrencia_pais": 1,
                "ocorrencia_aerodromo": 1,
                "ocorrencia_classificacao": 1,
                "ocorrencia_dia": 1,
                "ocorrencia_hora": 1,
                "investigacao_aeronave_liberada": 1,
                "investigacao_status": 1,
                "divulgacao_relatorio_numero": 1,
                "divulgacao_relatorio_publicado": 1,
                "divulgacao_dia_publicacao": 1,
                "total_recomendacoes": 1,
                "total_aeronaves_envolvidas": 1,
                "ocorrencia_saida_pista": 1,
                
                # Dados da aeronave (mesclados)
                "aeronave_matricula": 1,
                "aeronave_operador_categoria": 1,
                "aeronave_tipo_veiculo": 1,
                "aeronave_fabricante": 1,
                "aeronave_modelo": 1,
                "aeronave_tipo_icao": 1,
                "aeronave_motor_tipo": 1,
                "aeronave_motor_quantidade": 1,
                "aeronave_pmd": 1,
                "aeronave_pmd_categoria": 1,
                "aeronave_assentos": 1,
                "aeronave_ano_fabricacao": 1,
                "aeronave_pais_fabricante": 1,
                "aeronave_pais_registro": 1,
                "aeronave_registro_categoria": 1,
                "aeronave_registro_segmento": 1,
                "aeronave_voo_origem": 1,
                "aeronave_voo_destino": 1,
                "aeronave_fase_operacao": 1,
                "aeronave_tipo_operacao": 1,
                "aeronave_nivel_dano": 1,
                "aeronave_fatalidades_total": 1,
                
                # Dados de tipos de ocorrência (mesclados)
                "ocorrencia_tipo": 1,
                "ocorrencia_tipo_categoria": 1,
                "taxonomia_tipo_icao": 1,
                
                # Dados de fatores contribuintes (mesclados)
                "fator_nome": 1,
                "fator_aspecto": 1,
                "fator_condicionante": 1,
                "fator_area": 1,
                
                # Dados de recomendações (mesclados)
                "recomendacao_numero": 1,
                "recomendacao_conteudo": 1,
                "recomendacao_status": 1,
                "recomendacao_destinatario": 1,
                
                "_id": 0
            }
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            documents = await cursor.to_list(length=limit)
            
            app_logger.info(f"Documentos mesclados encontrados: {len(documents)}")
            
            # Processamento dos dados
            ocurrences = []
            invalid_count = 0
            
            for doc in documents:
                try:
                    # Processamento das coordenadas
                    lat = doc.get("ocorrencia_latitude")
                    lon = doc.get("ocorrencia_longitude")
                    
                    # Converte coordenadas para float se necessário
                    if isinstance(lat, str):
                        lat = float(lat.replace(",", "."))
                    if isinstance(lon, str):
                        lon = float(lon.replace(",", "."))
                    
                    doc["ocorrencia_latitude"] = float(lat)
                    doc["ocorrencia_longitude"] = float(lon)
                    
                    # Converte campos numéricos se necessário
                    numeric_fields = [
                        "total_recomendacoes", "total_aeronaves_envolvidas",
                        "aeronave_pmd", "aeronave_pmd_categoria", "aeronave_assentos",
                        "aeronave_ano_fabricacao", "aeronave_fatalidades_total"
                    ]
                    
                    for field in numeric_fields:
                        if field in doc and doc[field] is not None:
                            try:
                                if isinstance(doc[field], str) and doc[field].strip():
                                    doc[field] = int(float(doc[field].replace(",", ".")))
                                elif isinstance(doc[field], (int, float)):
                                    doc[field] = int(doc[field])
                            except (ValueError, TypeError):
                                doc[field] = None
                    
                    # Limpa campos de texto problemáticos
                    for key, value in doc.items():
                        if isinstance(value, str):
                            if value.strip().lower() in ['nan', 'null', '', '***', 'none']:
                                doc[key] = None
                            else:
                                doc[key] = value.strip()
                    
                    ocurrences.append(doc)
                    
                except Exception as e:
                    invalid_count += 1
                    if invalid_count <= 10:
                        app_logger.warning(f"Erro ao processar ocorrência mesclada {doc.get('codigo_ocorrencia', 'unknown')}: {e}")
                    continue
            
            app_logger.info(f"Processamento mesclado concluído - Válidos: {len(ocurrences)}, Inválidos: {invalid_count}")
            return ocurrences
            
        except Exception as e:
            app_logger.error(f"Erro ao buscar ocorrências mescladas: {e}")
            raise
    
    @staticmethod
    async def count_merged_ocurrences_with_coordinates() -> int:
        """
        Conta o total de ocorrências com coordenadas na collection mesclada
        
        Returns:
            Número total de ocorrências com coordenadas
        """
        try:
            collection = await get_collection("ocorrencia_completa")
            
            query = {
                "ocorrencia_latitude": {"$exists": True, "$ne": None, "$ne": ""},
                "ocorrencia_longitude": {"$exists": True, "$ne": None, "$ne": ""}
            }
            
            count = await collection.count_documents(query)
            return count
            
        except Exception as e:
            app_logger.error(f"Erro ao contar ocorrências mescladas: {e}")
            raise
    
    @staticmethod
    async def get_merged_stats() -> dict:
        """
        Retorna estatísticas da collection mesclada
        
        Returns:
            Dicionário com estatísticas dos dados mesclados
        """
        try:
            collection = await get_collection("ocorrencia_completa")
            
            # Contadores básicos
            total_docs = await collection.count_documents({})
            with_coords = await collection.count_documents({
                "ocorrencia_latitude": {"$exists": True, "$ne": None},
                "ocorrencia_longitude": {"$exists": True, "$ne": None}
            })
            with_aeronave = await collection.count_documents({
                "aeronave_matricula": {"$exists": True, "$ne": None, "$ne": ""}
            })
            with_recomendacoes = await collection.count_documents({
                "recomendacao_numero": {"$exists": True, "$ne": None, "$ne": ""}
            })
            
            stats = {
                "total_ocorrencias": total_docs,
                "com_coordenadas": with_coords,
                "com_dados_aeronave": with_aeronave,
                "com_recomendacoes": with_recomendacoes,
                "percentual_completo": round((with_aeronave / total_docs * 100), 2) if total_docs > 0 else 0
            }
            
            return stats
            
        except Exception as e:
            app_logger.error(f"Erro ao obter estatísticas mescladas: {e}")
            raise 