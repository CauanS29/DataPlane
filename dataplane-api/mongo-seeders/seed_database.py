#!/usr/bin/env python3
"""
Script para popular o banco de dados MongoDB com dados dos arquivos CSV
"""

import os
import sys
import pandas as pd
import asyncio
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MongoDBSeeder:
    """Classe para popular o MongoDB com dados dos CSV"""
    
    def __init__(self):
        self.client = None
        self.database = None
        self.seeders_dir = Path(__file__).parent
        self.datasets_dir = self.seeders_dir / "datasets"
        
        # Carrega variáveis de ambiente
        load_dotenv()
        
        # Configurações do MongoDB
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.mongodb_db = os.getenv("MONGODB_DB", "dataplane")
        self.mongodb_username = os.getenv("MONGODB_USERNAME")
        self.mongodb_password = os.getenv("MONGODB_PASSWORD")
        self.mongodb_auth_source = os.getenv("MONGODB_AUTH_SOURCE", "admin")
    
    def get_connection_string(self):
        """Gera a string de conexão do MongoDB"""
        if self.mongodb_username and self.mongodb_password:
            base_url = self.mongodb_url.replace("mongodb://", "")
            return f"mongodb://{self.mongodb_username}:{self.mongodb_password}@{base_url}/{self.mongodb_db}?authSource={self.mongodb_auth_source}"
        else:
            return f"{self.mongodb_url}/{self.mongodb_db}"
    
    async def connect(self):
        """Conecta ao MongoDB"""
        try:
            connection_string = self.get_connection_string()
            logger.info(f"Conectando ao MongoDB: {connection_string.replace(self.mongodb_password or '', '***') if self.mongodb_password else connection_string}")
            
            self.client = AsyncIOMotorClient(connection_string)
            self.database = self.client[self.mongodb_db]
            
            # Testa a conexão
            await self.client.admin.command('ping')
            logger.info("✅ Conectado ao MongoDB com sucesso")
            
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Desconecta do MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Desconectado do MongoDB")
    
    def get_csv_files(self):
        """Obtém lista de arquivos CSV na pasta datasets"""
        if not self.datasets_dir.exists():
            logger.warning(f"⚠️  Diretório de datasets não encontrado: {self.datasets_dir}")
            return []
        
        csv_files = list(self.datasets_dir.glob("*.csv"))
        logger.info(f"📁 Encontrados {len(csv_files)} arquivos CSV")
        return csv_files
    
    async def seed_collection_from_csv(self, csv_file: Path):
        """Popula uma coleção com dados de um arquivo CSV"""
        try:
            # Nome da coleção é o nome do arquivo CSV (sem extensão)
            collection_name = csv_file.stem
            logger.info(f"🌱 Populando coleção: {collection_name}")
            
            # Lê o arquivo CSV
            df = pd.read_csv(csv_file)
            logger.info(f"📊 CSV carregado: {len(df)} linhas, {len(df.columns)} colunas")
            
            # Converte DataFrame para lista de dicionários
            documents = df.to_dict('records')
            
            # Adiciona metadados
            for doc in documents:
                doc['_source'] = csv_file.name
                doc['_seeded_at'] = pd.Timestamp.now().isoformat()
            
            # Obtém a coleção
            collection = self.database[collection_name]
            
            # Limpa a coleção existente (opcional)
            await collection.delete_many({})
            logger.info(f"🧹 Coleção {collection_name} limpa")
            
            # Insere os documentos
            if documents:
                result = await collection.insert_many(documents)
                logger.info(f"✅ {len(result.inserted_ids)} documentos inseridos na coleção {collection_name}")
                
                # Cria índices para melhor performance
                await self.create_indexes(collection, df.columns)
                
                return len(result.inserted_ids)
            else:
                logger.warning(f"⚠️  Nenhum documento para inserir em {collection_name}")
                return 0
                
        except Exception as e:
            logger.error(f"❌ Erro ao popular coleção {csv_file.name}: {e}")
            raise
    
    async def create_indexes(self, collection, columns):
        """Cria índices para melhor performance"""
        try:
            # Índice padrão para _source
            await collection.create_index("_source")
            
            # Índice para _seeded_at
            await collection.create_index("_seeded_at")
            
            # Índices para colunas comuns (opcional)
            common_index_fields = ['id', 'name', 'title', 'created_at', 'updated_at']
            for field in common_index_fields:
                if field in columns:
                    await collection.create_index(field)
                    logger.info(f"📈 Índice criado para: {field}")
                    
        except Exception as e:
            logger.warning(f"⚠️  Erro ao criar índices: {e}")
    
    async def seed_all(self):
        """Executa todos os seeders"""
        try:
            # Conecta ao MongoDB
            await self.connect()
            
            # Obtém arquivos CSV
            csv_files = self.get_csv_files()
            
            if not csv_files:
                logger.warning("⚠️  Nenhum arquivo CSV encontrado para popular o banco")
                return
            
            total_documents = 0
            
            # Processa cada arquivo CSV
            for csv_file in csv_files:
                try:
                    documents_count = await self.seed_collection_from_csv(csv_file)
                    total_documents += documents_count
                except Exception as e:
                    logger.error(f"❌ Erro ao processar {csv_file.name}: {e}")
                    continue
            
            logger.info(f"🎉 Seeding concluído! Total de documentos inseridos: {total_documents}")
            
        except Exception as e:
            logger.error(f"❌ Erro durante o seeding: {e}")
            raise
        finally:
            await self.disconnect()


async def main():
    """Função principal"""
    print("=" * 60)
    print("🌱 MongoDB Seeder - Populando banco com dados CSV")
    print("=" * 60)
    
    try:
        seeder = MongoDBSeeder()
        await seeder.seed_all()
        print("\n✅ Seeding concluído com sucesso!")
        
    except Exception as e:
        print(f"\n❌ Erro durante o seeding: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 