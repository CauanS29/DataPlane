#!/usr/bin/env python3
"""
Script para regenerar apenas a collection mesclada (ocorrencia_completa)
Use este script quando os dados já estão no MongoDB mas você quer atualizar apenas a collection mesclada
"""

import sys
import subprocess
from pathlib import Path


def main():
    """Função principal"""
    print("=" * 60)
    print("🔄 REGENERAÇÃO DA COLLECTION MESCLADA")
    print("=" * 60)
    print()
    print("⚠️  IMPORTANTE:")
    print("Este script assume que os dados básicos já estão no MongoDB")
    print("(collections: ocorrencia, aeronave, ocorrencia_tipo, etc.)")
    print()
    print("Use este script para:")
    print("✅ Atualizar collection mesclada após mudanças")
    print("✅ Corrigir problemas na mesclagem")
    print("✅ Recriar índices da collection mesclada")
    print()
    
    # Confirmação do usuário
    resposta = input("Deseja continuar? (s/N): ").lower().strip()
    if resposta not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário")
        return
    
    print()
    print("🔄 Regenerando collection mesclada...")
    print("-" * 50)
    
    try:
        # Define o caminho do script de criação da collection mesclada
        script_path = Path(__file__).parent / "mongo-seeders" / "create_merged_collection.py"
        
        if not script_path.exists():
            print(f"❌ Script não encontrado: {script_path}")
            sys.exit(1)
        
        # Executa o script
        command = [sys.executable, str(script_path)]
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        
        # Exibe a saída
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("Avisos:")
            print(result.stderr)
        
        print()
        print("=" * 60)
        print("🎉 COLLECTION MESCLADA REGENERADA!")
        print("=" * 60)
        print()
        print("✅ Collection 'ocorrencia_completa' atualizada")
        print("🚀 Endpoints disponíveis:")
        print("   • GET /api/v1/ocurrence/complete - Dados completos")
        print("   • GET /api/v1/ocurrence/stats - Estatísticas atualizadas")
        print()
        
    except subprocess.CalledProcessError as e:
        print("❌ Erro ao regenerar collection mesclada")
        print("\nSaída:")
        print(e.stdout)
        print("\nErros:")
        print(e.stderr)
        print()
        print("🔧 Possíveis soluções:")
        print("- Verifique se o MongoDB está rodando")
        print("- Execute primeiro: python run_seeders.py")
        print("- Confirme as configurações no .env")
        sys.exit(1)
        
    except FileNotFoundError:
        print("❌ Python não encontrado no PATH")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 