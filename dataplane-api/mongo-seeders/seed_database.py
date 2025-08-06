#!/usr/bin/env python3
"""
Script para popular o banco de dados MongoDB com dados dos arquivos CSV
"""

import pandas as pd
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Carrega o .env da API para ter acesso às mesmas configurações
# Isso assume que o seeder é executado a partir do diretório raiz do projeto
# ou que o .env está no mesmo nível do diretório do seeder.
dotenv_path = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=dotenv_path)

# Agora podemos importar as settings, que serão preenchidas pelo .env
from app.config.settings import settings

class SeedDatabase:
    """
    Classe para popular o banco de dados MongoDB com dados de arquivos CSV.
    """
    def __init__(self):
        """Inicializa a classe, carregando as configurações do MongoDB."""
        self.mongodb_url = settings.MONGODB_URL
        self.mongodb_db = settings.MONGODB_DB
        self.mongodb_username = settings.MONGODB_USERNAME
        self.mongodb_password = settings.MONGODB_PASSWORD
        self.mongodb_auth_source = settings.MONGODB_AUTH_SOURCE
        self.client = None
        self.db = None
        self.datasets_path = Path(__file__).parent / 'datasets'

    def get_connection_string(self) -> str:
        """Gera a string de conexão do MongoDB com base nas configurações."""
        url = self.mongodb_url.replace("mongodb://", "")
        if self.mongodb_username and self.mongodb_password:
            return (
                f"mongodb://{self.mongodb_username}:{self.mongodb_password}@"
                f"{url}"
            )
        return f"mongodb://{url}"

    def connect(self):
        """Estabelece conexão com o banco de dados MongoDB."""
        try:
            connection_string = self.get_connection_string()
            print(f"🔌 Conectando ao MongoDB...")
            self.client = MongoClient(
                connection_string,
                authSource='admin'
            )
            self.db = self.client[self.mongodb_db]
            # Testa a conexão
            self.client.admin.command('ping')
            print("✅ Conexão com o MongoDB estabelecida com sucesso!")
        except ConnectionFailure as e:
            print(f"❌ Erro de conexão com o MongoDB: {e}")
            sys.exit(1)
        except OperationFailure as e:
            print(f"❌ Erro de autenticação no MongoDB: {e}")
            print("   Verifique as credenciais e o 'authSource'.")
            sys.exit(1)

    def disconnect(self):
        """Fecha a conexão com o banco de dados."""
        if self.client:
            self.client.close()
            print("🔌 Conexão com o MongoDB fechada.")

    def get_csv_files(self) -> list[Path]:
        """Obtém a lista de arquivos CSV do diretório de datasets."""
        if not self.datasets_path.exists():
            print(f"⚠️  Diretório de datasets não encontrado: {self.datasets_path}")
            return []
        
        csv_files = list(self.datasets_path.glob("*.csv"))
        print(f"📁 Encontrados {len(csv_files)} arquivos CSV para importação.")
        return csv_files

    def seed_data(self):
        """Lê os arquivos CSV e insere os dados no MongoDB."""
        self.connect()
        csv_files = self.get_csv_files()

        if not csv_files:
            print("Nenhum dado para popular. Encerrando.")
            self.disconnect()
            return

        for file_path in csv_files:
            try:
                collection_name = file_path.stem
                print(f"\n🔄 Processando arquivo: {file_path.name} -> Coleção: '{collection_name}'")
                
                df = pd.read_csv(file_path, sep=';', encoding='latin1')
                
                # Limpa os nomes das colunas
                df.columns = df.columns.str.strip()
                
                # Converte o dataframe para uma lista de dicionários
                data = df.to_dict(orient='records')
                
                if not data:
                    print(f"📄 Arquivo {file_path.name} está vazio. Pulando.")
                    continue

                collection = self.db[collection_name]
                
                # Limpa a coleção antes de inserir novos dados
                print(f"🗑️  Limpando a coleção '{collection_name}'...")
                collection.delete_many({})
                
                # Insere os novos dados
                print(f"➕ Inserindo {len(data)} documentos na coleção '{collection_name}'...")
                collection.insert_many(data)
                print(f"✅ Dados do arquivo {file_path.name} inseridos com sucesso.")

            except FileNotFoundError:
                print(f"❌ Erro: Arquivo {file_path} não encontrado.")
            except Exception as e:
                print(f"❌ Ocorreu um erro ao processar o arquivo {file_path.name}: {e}")

        self.disconnect()

if __name__ == '__main__':
    seeder = SeedDatabase()
    seeder.seed_data() 