#!/usr/bin/env python3
"""
Script de inicialização da DataPlane API
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Verifica se a versão do Python é compatível"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 ou superior é necessário")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detectado")


def create_directories():
    """Cria diretórios necessários"""
    directories = ["logs", "models/checkpoint"]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Diretório criado: {directory}")


def install_dependencies():
    """Instala as dependências"""
    try:
        print("📦 Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependências instaladas com sucesso")
    except subprocess.CalledProcessError:
        print("❌ Erro ao instalar dependências")
        sys.exit(1)


def setup_environment():
    """Configura o ambiente"""
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists() and env_example.exists():
        print("🔧 Configurando variáveis de ambiente...")
        with open(env_example, 'r') as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✅ Arquivo .env criado. Edite as configurações conforme necessário.")
        print("⚠️  IMPORTANTE: Configure o API_TOKEN e as credenciais do MongoDB no arquivo .env")
    elif env_file.exists():
        print("✅ Arquivo .env já existe")
    else:
        print("⚠️  Arquivo env.example não encontrado")


def check_mongodb():
    """Verifica se o MongoDB está rodando"""
    try:
        import pymongo
        from dotenv import load_dotenv
        
        # Carrega variáveis de ambiente
        load_dotenv()
        
        # Tenta conectar com as credenciais da aplicação
        username = os.getenv("MONGODB_USERNAME")
        password = os.getenv("MONGODB_PASSWORD")
        
        if username and password:
            # Conecta com autenticação
            connection_string = f"mongodb://{username}:{password}@localhost:27017/dataplane?authSource=admin"
            client = pymongo.MongoClient(connection_string, serverSelectionTimeoutMS=2000)
        else:
            # Conecta sem autenticação (para desenvolvimento)
            client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        
        client.admin.command('ping')
        print("✅ MongoDB está rodando e acessível")
        client.close()
        return True
        
    except Exception as e:
        print("⚠️  MongoDB não está rodando ou não está acessível")
        print(f"   Erro: {e}")
        print("💡 Para iniciar MongoDB com Docker:")
        print("   python setup_mongodb.py")
        print("   ou")
        print("   docker-compose up -d mongodb")
        return False


def start_server():
    """Inicia o servidor"""
    print("🚀 Iniciando DataPlane API...")
    print("📖 Documentação disponível em: http://localhost:8000/docs")
    print("🔍 Health check em: http://localhost:8000/api/v1/health")
    print("⏹️  Pressione Ctrl+C para parar o servidor")
    print("-" * 50)
    
    try:
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n👋 Servidor encerrado")


def main():
    """Função principal"""
    print("=" * 50)
    print("🤖 DataPlane API - Setup e Inicialização")
    print("=" * 50)
    
    # Verifica versão do Python
    check_python_version()
    
    # Cria diretórios
    create_directories()
    
    # Configura ambiente
    setup_environment()
    
    # Instala dependências se requirements.txt existir
    if Path("requirements.txt").exists():
        install_dependencies()
    else:
        print("⚠️  Arquivo requirements.txt não encontrado")
    
    # Verifica MongoDB
    check_mongodb()
    
    # Inicia o servidor
    start_server()


if __name__ == "__main__":
    main() 