#!/usr/bin/env python3
"""
Script para executar seeders do MongoDB via Docker
"""

import subprocess
import sys
import os
from pathlib import Path


def run_seeders():
    """
    Executa o script de popular o banco de dados.
    Este script garante que as dependências sejam instaladas e que o
    script principal do seeder seja chamado.
    """
    print("=" * 60)
    print("🌱 Iniciando o processo de popular o banco de dados...")
    print("=" * 60)

    try:
        # Define o caminho para o script do seeder
        seeder_script_path = Path(__file__).parent / "mongo-seeders" / "seed_database.py"

        if not seeder_script_path.exists():
            print(f"❌ Erro: Script do seeder não encontrado em '{seeder_script_path}'")
            sys.exit(1)

        # O ambiente virtual e as dependências já devem estar ativos
        # se este script for executado no contexto do Docker ou com 'pipenv run'.
        # Apenas executamos o script diretamente.
        print(f"🐍 Executando script: {seeder_script_path.name}")
        
        # Constrói o comando para executar o script
        command = [sys.executable, str(seeder_script_path)]
        
        # Executa o comando
        result = subprocess.run(command, check=True, text=True, capture_output=True)

        # Imprime a saída do script filho
        if result.stdout:
            print("\n--- Saída do script ---\n")
            print(result.stdout)
        
        if result.stderr:
            print("\n--- Erros do script ---\n")
            print(result.stderr)
            
        print("\n✅ Processo de popular o banco de dados concluído com sucesso!")

    except FileNotFoundError:
        print("❌ Erro: O Python não foi encontrado. Verifique se ele está no PATH.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar o script do seeder.")
        print("\n--- Saída do script ---\n")
        print(e.stdout)
        print("\n--- Erros do script ---\n")
        print(e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Ocorreu um erro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_seeders() 