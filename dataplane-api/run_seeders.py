#!/usr/bin/env python3
"""
Script para executar seeders do MongoDB via Docker
"""

import subprocess
import sys
import os
from pathlib import Path


def check_docker():
    """Verifica se o Docker está rodando"""
    try:
        subprocess.run(["docker", "ps"], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker não está rodando ou não está instalado")
        return False


def check_containers():
    """Verifica se os containers estão rodando"""
    try:
        # Verifica se o container da API está rodando
        result = subprocess.run(
            ["docker", "ps", "--filter", "name=dataplane-api-api-1", "--format", "{{.Names}}"],
            capture_output=True, text=True
        )
        
        if "dataplane-api-api-1" in result.stdout:
            print("✅ Container da API está rodando")
            return True
        else:
            print("⚠️  Container da API não está rodando")
            print("💡 Execute: docker-compose up -d")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar containers: {e}")
        return False


def run_seeders():
    """Executa os seeders via Docker"""
    try:
        print("🌱 Executando seeders do MongoDB...")
        
        # Executa o script de seeding dentro do container
        result = subprocess.run([
            "docker-compose", "exec", "-T", "api", 
            "python", "mongo-seeders/seed_database.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Seeders executados com sucesso!")
            print("\n📊 Logs:")
            print(result.stdout)
        else:
            print("❌ Erro ao executar seeders:")
            print(result.stderr)
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Erro ao executar seeders: {e}")
        return False


def run_seeders_local():
    """Executa os seeders localmente"""
    try:
        print("🌱 Executando seeders localmente...")
        
        # Verifica se o arquivo existe
        seed_script = Path("mongo-seeders/seed_database.py")
        if not seed_script.exists():
            print("❌ Script de seeding não encontrado")
            return False
        
        # Executa o script
        result = subprocess.run([
            sys.executable, "mongo-seeders/seed_database.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Seeders executados com sucesso!")
            print("\n📊 Logs:")
            print(result.stdout)
        else:
            print("❌ Erro ao executar seeders:")
            print(result.stderr)
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Erro ao executar seeders: {e}")
        return False


def main():
    """Função principal"""
    print("=" * 60)
    print("🌱 MongoDB Seeders Runner")
    print("=" * 60)
    
    # Verifica se está rodando via Docker ou localmente
    if os.getenv("DOCKER_ENV"):
        print("🐳 Modo Docker detectado")
        
        if not check_docker():
            sys.exit(1)
        
        if not check_containers():
            sys.exit(1)
        
        success = run_seeders()
    else:
        print("💻 Modo local detectado")
        success = run_seeders_local()
    
    if success:
        print("\n🎉 Seeding concluído com sucesso!")
        print("💡 Você pode verificar os dados no MongoDB:")
        print("   docker exec mongodb mongosh --username dataplane_user --password dataplane_password --authenticationDatabase admin")
    else:
        print("\n❌ Seeding falhou!")
        sys.exit(1)


if __name__ == "__main__":
    main() 