#!/usr/bin/env python3
"""
Script simples para criar a collection mesclada com dados de todas as tabelas
Execute: python create_merged_data.py
"""

import sys
from pathlib import Path

# Adiciona o path do projeto
sys.path.append(str(Path(__file__).parent))

# Importa o criador da collection mesclada
from mongo_seeders.create_merged_collection import MergedCollectionCreator

def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 CRIAÇÃO DE COLLECTION MESCLADA - DataPlane")
    print("=" * 60)
    print()
    print("Este script irá:")
    print("✅ Ler todos os arquivos CSV (ocorrencia, aeronave, etc.)")
    print("✅ Fazer JOIN das tabelas baseado nos códigos de ocorrência")
    print("✅ Criar collection 'ocorrencia_completa' no MongoDB")
    print("✅ Incluir TODOS os dados: ocorrências + aeronaves + tipos + fatores + recomendações")
    print()
    
    # Confirmação do usuário
    resposta = input("Deseja continuar? (s/N): ").lower().strip()
    if resposta not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário")
        return
    
    print()
    print("🔄 Iniciando processo de mesclagem...")
    print()
    
    try:
        # Cria a collection mesclada
        creator = MergedCollectionCreator()
        creator.create_merged_collection()
        
        print()
        print("=" * 60)
        print("🎉 COLLECTION MESCLADA CRIADA COM SUCESSO!")
        print("=" * 60)
        print()
        print("📋 Próximos passos:")
        print("1️⃣  Acesse: GET /api/v1/ocurrence/complete")
        print("2️⃣  Para estatísticas: GET /api/v1/ocurrence/stats")
        print("3️⃣  A collection 'ocorrencia_completa' está disponível")
        print()
        print("💡 Exemplo de uso:")
        print("   GET /api/v1/ocurrence/complete?limit=100")
        print("   Retorna dados completos com aeronaves, tipos, fatores e recomendações")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ ERRO DURANTE A CRIAÇÃO")
        print("=" * 60)
        print(f"Erro: {e}")
        print()
        print("🔧 Verifique:")
        print("- Conexão com MongoDB")
        print("- Arquivos CSV na pasta mongo-seeders/datasets/")
        print("- Configurações no arquivo .env")
        print()
        sys.exit(1)

if __name__ == '__main__':
    main() 