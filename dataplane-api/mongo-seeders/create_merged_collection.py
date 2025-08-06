#!/usr/bin/env python3
"""
Script para criar uma collection mesclada com dados de todas as tabelas relacionadas a ocorrências
"""

import pandas as pd
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm
import json

# Carrega o .env da API
dotenv_path = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=dotenv_path)

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.config.settings import settings


class MergedCollectionCreator:
    """
    Classe para criar uma collection mesclada com dados de todas as tabelas
    """
    
    def __init__(self):
        """Inicializa a classe"""
        self.mongodb_url = settings.MONGODB_URL
        self.mongodb_db = settings.MONGODB_DB
        self.mongodb_username = settings.MONGODB_USERNAME
        self.mongodb_password = settings.MONGODB_PASSWORD
        self.mongodb_auth_source = settings.MONGODB_AUTH_SOURCE
        self.client = None
        self.db = None
        self.datasets_path = Path(__file__).parent / 'datasets'
    
    def get_connection_string(self) -> str:
        """Gera a string de conexão do MongoDB"""
        url = self.mongodb_url.replace("mongodb://", "")
        if self.mongodb_username and self.mongodb_password:
            return f"mongodb://{self.mongodb_username}:{self.mongodb_password}@{url}"
        return f"mongodb://{url}"
    
    def connect(self):
        """Conecta ao MongoDB"""
        try:
            connection_string = self.get_connection_string()
            print(f"🔌 Conectando ao MongoDB...")
            self.client = MongoClient(
                connection_string,
                authSource='admin'
            )
            self.db = self.client[self.mongodb_db]
            self.client.admin.command('ping')
            print("✅ Conexão estabelecida com sucesso!")
        except (ConnectionFailure, OperationFailure) as e:
            print(f"❌ Erro de conexão: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """Desconecta do MongoDB"""
        if self.client:
            self.client.close()
            print("🔌 Conexão fechada.")
    
    def load_csv_data(self) -> dict:
        """Carrega todos os CSVs em DataFrames"""
        print("📂 Carregando arquivos CSV...")
        data = {}
        
        csv_files = {
            'ocorrencia': self.datasets_path / 'ocorrencia.csv',
            'aeronave': self.datasets_path / 'aeronave.csv',
            'ocorrencia_tipo': self.datasets_path / 'ocorrencia_tipo.csv',
            'fator_contribuinte': self.datasets_path / 'fator_contribuinte.csv',
            'recomendacao': self.datasets_path / 'recomendacao.csv'
        }
        
        for name, file_path in csv_files.items():
            if file_path.exists():
                print(f"   📄 Carregando {name}...")
                df = pd.read_csv(file_path, sep=';', encoding='latin1')
                df.columns = df.columns.str.strip()
                
                # Converte todos os códigos de ocorrência para string para evitar problemas de tipo no merge
                codigo_columns = [col for col in df.columns if col.startswith('codigo_ocorrencia')]
                for col in codigo_columns:
                    df[col] = df[col].astype(str)
                    print(f"      🔧 {col} convertido para string")
                
                data[name] = df
                print(f"      ✅ {len(df)} registros carregados")
            else:
                print(f"   ⚠️  Arquivo {file_path} não encontrado")
                data[name] = pd.DataFrame()
        
        return data
    
    def merge_data(self, data: dict) -> pd.DataFrame:
        """Mescla todos os DataFrames numa estrutura unificada"""
        print("🔄 Mesclando dados...")
        
        # DataFrame principal (ocorrencia)
        merged_df = data['ocorrencia'].copy()
        print(f"   📊 Base: {len(merged_df)} ocorrências")
        
        # JOIN com aeronave (1:N - uma ocorrência pode ter múltiplas aeronaves)
        if not data['aeronave'].empty:
            print("   🛩️  Mesclando dados de aeronaves...")
            # Para simplicidade, vamos pegar apenas a primeira aeronave de cada ocorrência
            aeronave_first = data['aeronave'].groupby('codigo_ocorrencia2').first().reset_index()
            merged_df = merged_df.merge(
                aeronave_first,
                left_on='codigo_ocorrencia',
                right_on='codigo_ocorrencia2',
                how='left',
                suffixes=('', '_aeronave')
            )
            print(f"      ✅ {len(aeronave_first)} aeronaves mescladas")
        
        # JOIN com ocorrencia_tipo (1:N - uma ocorrência pode ter múltiplos tipos)
        if not data['ocorrencia_tipo'].empty:
            print("   📋 Mesclando tipos de ocorrência...")
            # Agrupa tipos numa lista para cada ocorrência
            tipos_grouped = data['ocorrencia_tipo'].groupby('codigo_ocorrencia1').agg({
                'ocorrencia_tipo': lambda x: '; '.join(x.astype(str).unique()),
                'ocorrencia_tipo_categoria': lambda x: '; '.join(x.astype(str).unique()),
                'taxonomia_tipo_icao': lambda x: '; '.join(x.astype(str).unique())
            }).reset_index()
            
            merged_df = merged_df.merge(
                tipos_grouped,
                left_on='codigo_ocorrencia1',
                right_on='codigo_ocorrencia1',
                how='left',
                suffixes=('', '_tipo')
            )
            print(f"      ✅ {len(tipos_grouped)} tipos de ocorrência mesclados")
        
        # JOIN com fator_contribuinte (1:N - uma ocorrência pode ter múltiplos fatores)
        if not data['fator_contribuinte'].empty:
            print("   ⚠️  Mesclando fatores contribuintes...")
            fatores_grouped = data['fator_contribuinte'].groupby('codigo_ocorrencia3').agg({
                'fator_nome': lambda x: '; '.join(x.astype(str).unique()),
                'fator_aspecto': lambda x: '; '.join(x.astype(str).unique()),
                'fator_condicionante': lambda x: '; '.join(x.astype(str).unique()),
                'fator_area': lambda x: '; '.join(x.astype(str).unique())
            }).reset_index()
            
            merged_df = merged_df.merge(
                fatores_grouped,
                left_on='codigo_ocorrencia3',
                right_on='codigo_ocorrencia3',
                how='left',
                suffixes=('', '_fator')
            )
            print(f"      ✅ {len(fatores_grouped)} fatores contribuintes mesclados")
        
        # JOIN com recomendacao (1:N - uma ocorrência pode ter múltiplas recomendações)
        if not data['recomendacao'].empty:
            print("   📝 Mesclando recomendações...")
            recomendacoes_grouped = data['recomendacao'].groupby('codigo_ocorrencia4').agg({
                'recomendacao_numero': lambda x: '; '.join(x.astype(str).unique()),
                'recomendacao_conteudo': lambda x: ' | '.join(x.astype(str).unique()),
                'recomendacao_status': lambda x: '; '.join(x.astype(str).unique()),
                'recomendacao_destinatario': lambda x: '; '.join(x.astype(str).unique())
            }).reset_index()
            
            merged_df = merged_df.merge(
                recomendacoes_grouped,
                left_on='codigo_ocorrencia4',
                right_on='codigo_ocorrencia4',
                how='left',
                suffixes=('', '_rec')
            )
            print(f"      ✅ {len(recomendacoes_grouped)} recomendações mescladas")
        
        print(f"🎯 Dados mesclados: {len(merged_df)} registros finais")
        return merged_df
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Limpa e padroniza os dados"""
        print("🧹 Limpando dados...")
        
        # Remove colunas duplicadas geradas pelos joins
        columns_to_drop = [col for col in df.columns if col.endswith('_aeronave') or col.endswith('_tipo') or col.endswith('_fator') or col.endswith('_rec')]
        columns_to_drop = [col for col in columns_to_drop if col.replace('_aeronave', '').replace('_tipo', '').replace('_fator', '').replace('_rec', '') in df.columns]
        
        if columns_to_drop:
            df = df.drop(columns=columns_to_drop)
            print(f"   🗑️  Removidas {len(columns_to_drop)} colunas duplicadas")
        
        # Substitui valores NaN por None para o MongoDB
        df = df.where(pd.notnull(df), None)
        
        # Converte tipos de dados problemáticos
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).replace('nan', None)
        
        print(f"   ✅ Dados limpos: {len(df)} registros")
        return df
    
    def save_to_mongodb(self, df: pd.DataFrame, collection_name: str = 'ocorrencia_completa'):
        """Salva o DataFrame mesclado no MongoDB"""
        print(f"💾 Salvando na collection '{collection_name}'...")
        
        # Conecta ao MongoDB
        self.connect()
        
        # Limpa a collection existente
        collection = self.db[collection_name]
        print(f"🗑️  Limpando collection existente...")
        collection.delete_many({})
        
        # Converte DataFrame para dicionários
        records = df.to_dict(orient='records')
        
        # Insere em lotes para melhor performance
        batch_size = 1000
        total_batches = len(records) // batch_size + (1 if len(records) % batch_size else 0)
        
        print(f"📝 Inserindo {len(records)} registros em {total_batches} lotes...")
        
        with tqdm(total=len(records), desc="Inserindo dados") as pbar:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                collection.insert_many(batch)
                pbar.update(len(batch))
        
        print(f"✅ Collection '{collection_name}' criada com sucesso!")
        
        # Cria índices importantes
        print("🔍 Criando índices...")
        collection.create_index("codigo_ocorrencia")
        collection.create_index([("ocorrencia_latitude", 1), ("ocorrencia_longitude", 1)])
        collection.create_index("ocorrencia_classificacao")
        collection.create_index("aeronave_fabricante")
        print("   ✅ Índices criados")
        
        self.disconnect()
    
    def create_merged_collection(self):
        """Método principal para criar a collection mesclada"""
        print("🚀 Iniciando criação da collection mesclada...")
        
        try:
            # 1. Carrega dados dos CSVs
            data = self.load_csv_data()
            
            # 2. Mescla os dados
            merged_df = self.merge_data(data)
            
            # 3. Limpa os dados
            cleaned_df = self.clean_data(merged_df)
            
            # 4. Salva no MongoDB
            self.save_to_mongodb(cleaned_df)
            
            print("🎉 Collection mesclada criada com sucesso!")
            print(f"📊 Total de registros: {len(cleaned_df)}")
            
        except Exception as e:
            print(f"❌ Erro durante o processo: {e}")
            raise


if __name__ == '__main__':
    creator = MergedCollectionCreator()
    creator.create_merged_collection() 