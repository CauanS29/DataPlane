#!/usr/bin/env python3
"""
Script para setup do MongoDB
"""

import subprocess
import sys
import time
from pathlib import Path


def check_docker():
    """Verifica se o Docker está instalado"""
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        print("✅ Docker está instalado")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker não está instalado")
        print("💡 Instale o Docker em: https://docs.docker.com/get-docker/")
        return False


def check_docker_compose():
    """Verifica se o Docker Compose está disponível"""
    try:
        subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        print("✅ Docker Compose está disponível")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  Docker Compose não está disponível")
        return False


def start_mongodb_docker():
    """Inicia MongoDB usando Docker com autenticação"""
    try:
        print("🐳 Iniciando MongoDB com Docker...")
        
        # Verifica se o container já existe
        result = subprocess.run(
            ["docker", "ps", "-a", "--filter", "name=mongodb", "--format", "{{.Names}}"],
            capture_output=True, text=True
        )
        
        if "mongodb" in result.stdout:
            print("📦 Container MongoDB já existe, iniciando...")
            subprocess.run(["docker", "start", "mongodb"], check=True)
        else:
            print("📦 Criando e iniciando container MongoDB...")
            subprocess.run([
                "docker", "run", "-d",
                "--name", "mongodb",
                "-p", "27017:27017",
                "-v", "mongodb_data:/data/db",
                "-e", "MONGO_INITDB_ROOT_USERNAME=admin",
                "-e", "MONGO_INITDB_ROOT_PASSWORD=admin_password",
                "-e", "MONGO_INITDB_DATABASE=dataplane",
                "mongo:7"
            ], check=True)
        
        print("✅ MongoDB iniciado com sucesso!")
        print("📍 Acessível em: mongodb://localhost:27017")
        print("🔐 Usuário root: admin / admin_password")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao iniciar MongoDB: {e}")
        return False


def start_mongodb_compose():
    """Inicia MongoDB usando Docker Compose"""
    try:
        print("🐳 Iniciando MongoDB com Docker Compose...")
        
        # Verifica se o docker-compose.yml existe
        if not Path("docker-compose.yml").exists():
            print("❌ Arquivo docker-compose.yml não encontrado")
            return False
        
        subprocess.run(["docker-compose", "up", "-d", "mongodb"], check=True)
        print("✅ MongoDB iniciado com Docker Compose!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao iniciar MongoDB: {e}")
        return False


def create_mongodb_user():
    """Cria o usuário da aplicação no MongoDB"""
    try:
        print("👤 Criando usuário da aplicação...")
        
        # Script para criar usuário
        create_user_script = """
        db = db.getSiblingDB('admin');
        db.auth('admin', 'admin_password');
        
        db = db.getSiblingDB('dataplane');
        
        db.createUser({
          user: "dataplane_user",
          pwd: "dataplane_password",
          roles: [
            {
              role: "readWrite",
              db: "dataplane"
            }
          ]
        });
        
        db.createCollection('ai_requests');
        db.ai_requests.createIndex({ "created_at": -1 });
        db.ai_requests.createIndex({ "model_name": 1 });
        
        print("✅ Usuário criado com sucesso!");
        """
        
        # Executa o script
        subprocess.run([
            "docker", "exec", "mongodb", "mongosh",
            "--username", "admin",
            "--password", "admin_password",
            "--authenticationDatabase", "admin",
            "--eval", create_user_script
        ], check=True)
        
        print("✅ Usuário da aplicação criado!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao criar usuário: {e}")
        return False


def wait_for_mongodb():
    """Aguarda o MongoDB estar pronto"""
    print("⏳ Aguardando MongoDB estar pronto...")
    
    for i in range(30):  # 30 tentativas, 2 segundos cada
        try:
            import pymongo
            # Tenta conectar com usuário root primeiro
            client = pymongo.MongoClient(
                "mongodb://admin:admin_password@localhost:27017/admin",
                serverSelectionTimeoutMS=1000
            )
            client.admin.command('ping')
            client.close()
            print("✅ MongoDB está pronto!")
            return True
        except Exception:
            time.sleep(2)
            print(f"⏳ Tentativa {i+1}/30...")
    
    print("❌ Timeout aguardando MongoDB")
    return False


def main():
    """Função principal"""
    print("=" * 50)
    print("🗄️  Setup do MongoDB")
    print("=" * 50)
    
    # Verifica Docker
    if not check_docker():
        sys.exit(1)
    
    # Tenta usar Docker Compose primeiro
    if check_docker_compose() and Path("docker-compose.yml").exists():
        print("🚀 Usando Docker Compose...")
        if start_mongodb_compose():
            wait_for_mongodb()
            # Docker Compose já cria o usuário via script de inicialização
        else:
            sys.exit(1)
    else:
        print("🚀 Usando Docker diretamente...")
        if start_mongodb_docker():
            wait_for_mongodb()
            create_mongodb_user()
        else:
            sys.exit(1)
    
    print("\n🎉 Setup do MongoDB concluído!")
    print("📊 Credenciais:")
    print("   - Usuário da aplicação: dataplane_user")
    print("   - Senha da aplicação: dataplane_password")
    print("   - Banco: dataplane")
    print("💡 Agora você pode executar: python start.py")


if __name__ == "__main__":
    main() 