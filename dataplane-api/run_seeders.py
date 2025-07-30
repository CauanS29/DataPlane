#!/usr/bin/env python3
"""
Script para executar seeders do MongoDB via Docker
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """
    Executa um comando e trata os resultados
    
    Args:
        command: Lista com o comando a ser executado
        description: Descrição do que está sendo executado
    """
    print(f"🐍 Executando: {description}")
    
    try:
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        
        # Imprime a saída do script
        if result.stdout:
            print("\n--- Saída ---\n")
            print(result.stdout)
        
        if result.stderr:
            print("\n--- Avisos ---\n")
            print(result.stderr)
        
        print(f"✅ {description} concluído com sucesso!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar: {description}")
        print("\n--- Saída ---\n")
        print(e.stdout)
        print("\n--- Erros ---\n")
        print(e.stderr)
        return False
    except Exception as e:
        print(f"❌ Erro inesperado em {description}: {e}")
        return False


def run_seeders():
    """
    Executa o processo completo de popular o banco de dados:
    1. Seeding básico das collections separadas
    2. Criação da collection mesclada com todos os dados
    """
    print("=" * 60)
    print("🌱 INICIANDO PROCESSO COMPLETO DE SEEDING")
    print("=" * 60)
    print()
    print("Este processo irá:")
    print("1️⃣  Popular collections separadas (ocorrencia, aeronave, etc.)")
    print("2️⃣  Criar collection mesclada (ocorrencia_completa)")
    print("3️⃣  Configurar índices e otimizações")
    print()

    # Define os caminhos dos scripts
    seeder_script_path = Path(__file__).parent / "mongo-seeders" / "seed_database.py"
    merged_script_path = Path(__file__).parent / "mongo-seeders" / "create_merged_collection.py"

    # Verifica se os scripts existem
    if not seeder_script_path.exists():
        print(f"❌ Erro: Script do seeder não encontrado em '{seeder_script_path}'")
        sys.exit(1)
    
    if not merged_script_path.exists():
        print(f"❌ Erro: Script da collection mesclada não encontrado em '{merged_script_path}'")
        sys.exit(1)

    success_count = 0
    total_steps = 2

    try:
        # PASSO 1: Executa o seeding básico das collections separadas
        print("🔄 PASSO 1/2: Populando collections separadas...")
        print("-" * 50)
        
        command1 = [sys.executable, str(seeder_script_path)]
        if run_command(command1, "Seeding das collections básicas"):
            success_count += 1
        
        print("\n" + "=" * 60)
        
        # PASSO 2: Cria a collection mesclada
        print("🔄 PASSO 2/2: Criando collection mesclada...")
        print("-" * 50)
        
        command2 = [sys.executable, str(merged_script_path)]
        if run_command(command2, "Criação da collection mesclada"):
            success_count += 1
        
        # Resultado final
        print("\n" + "=" * 60)
        if success_count == total_steps:
            print("🎉 PROCESSO DE SEEDING COMPLETO!")
            print("=" * 60)
            print()
            print("✅ Collections criadas com sucesso:")
            print("   📊 ocorrencia - Dados básicos de ocorrências")
            print("   🛩️  aeronave - Dados das aeronaves")
            print("   📋 ocorrencia_tipo - Tipos de ocorrência")
            print("   ⚠️  fator_contribuinte - Fatores contribuintes")
            print("   📝 recomendacao - Recomendações")
            print("   🔗 ocorrencia_completa - DADOS MESCLADOS (NOVO!)")
            print()
            print("🚀 API pronta para uso:")
            print("   • GET /api/v1/ocurrence/coordinates - Dados básicos")
            print("   • GET /api/v1/ocurrence/complete - Dados completos mesclados")
            print("   • GET /api/v1/ocurrence/stats - Estatísticas")
            print()
        else:
            print("⚠️  PROCESSO PARCIALMENTE CONCLUÍDO")
            print("=" * 60)
            print(f"Sucessos: {success_count}/{total_steps}")
            print()
            print("🔧 Verifique:")
            print("- Conexão com MongoDB")
            print("- Arquivos CSV na pasta mongo-seeders/datasets/")
            print("- Configurações no arquivo .env")
            print()

    except FileNotFoundError:
        print("❌ Erro: O Python não foi encontrado. Verifique se ele está no PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Ocorreu um erro inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_seeders() 