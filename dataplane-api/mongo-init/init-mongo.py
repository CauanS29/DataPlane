import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

def main():
    """
    Script de inicialização do MongoDB.
    Cria um usuário e um banco de dados para a aplicação.
    """
    try:
        # Carrega as configurações das variáveis de ambiente
        mongo_admin_user = os.getenv("MONGO_INITDB_ROOT_USERNAME", "admin")
        mongo_admin_pass = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "admin_password")
        mongo_host = os.getenv("MONGODB_HOST", "localhost")
        
        app_user = os.getenv("MONGODB_USERNAME")
        app_pass = os.getenv("MONGODB_PASSWORD")
        app_db = os.getenv("MONGODB_DB")

        if not all([app_user, app_pass, app_db]):
            print("❌ Erro: Variáveis de ambiente MONGODB_USERNAME, MONGODB_PASSWORD e MONGODB_DB devem ser definidas.")
            sys.exit(1)

        # Conexão com o MongoDB
        mongo_url = f"mongodb://{mongo_admin_user}:{mongo_admin_pass}@{mongo_host}:27017"
        client = MongoClient(mongo_url)

        # Verifica se a conexão foi bem-sucedida
        client.admin.command('ping')
        print("✅ Conexão com o MongoDB estabelecida com sucesso!")

        # Conecta ao banco 'admin' para criar o usuário
        admin_db = client['admin']

        # Cria o usuário da aplicação se ele não existir
        print(f"👤 Criando usuário '{app_user}'...")
        try:
            admin_db.command(
                'createUser',
                app_user,
                pwd=app_pass,
                roles=[{'role': 'readWrite', 'db': app_db}]
            )
            print(f"👤 Usuário '{app_user}' criado com sucesso!")
        except OperationFailure as e:
            if "already exists" in str(e):
                print(f"👤 Usuário '{app_user}' já existe.")
            else:
                raise

        # Conecta ao banco da aplicação
        dataplane_db = client[app_db]

        # Cria a coleção 'ai_requests' se não existir
        print("🗂️  Criando coleção 'ai_requests'...")
        if 'ai_requests' not in dataplane_db.list_collection_names():
            dataplane_db.create_collection('ai_requests')
            print("🗂️  Coleção 'ai_requests' criada.")
        else:
            print("🗂️  Coleção 'ai_requests' já existe.")

        # Cria índices para a coleção
        print("🔍 Criando índices para 'ai_requests'...")
        dataplane_db.ai_requests.create_index([("created_at", -1)])
        dataplane_db.ai_requests.create_index([("model_name", 1)])
        print("🔍 Índices criados com sucesso.")

        print(f"\n✅ MongoDB inicializado com sucesso para o banco '{app_db}'!")

    except ConnectionFailure as e:
        print(f"❌ Erro de conexão com o MongoDB: {e}")
        sys.exit(1)
    except OperationFailure as e:
        print(f"❌ Erro de operação no MongoDB: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Ocorreu um erro inesperado: {e}")
        sys.exit(1)
    finally:
        if 'client' in locals() and client:
            client.close()
            print("🔌 Conexão com o MongoDB fechada.")

if __name__ == "__main__":
    main() 