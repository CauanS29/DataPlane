// Script de inicialização do MongoDB
// Este script é executado automaticamente quando o container MongoDB é iniciado pela primeira vez

// Conecta ao banco admin
db = db.getSiblingDB('admin');

// Cria o usuário para a aplicação
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

// Conecta ao banco da aplicação
db = db.getSiblingDB('dataplane');

// Cria a coleção ai_requests se não existir
db.createCollection('ai_requests');

// Cria índices para melhor performance
db.ai_requests.createIndex({ "created_at": -1 });
db.ai_requests.createIndex({ "model_name": 1 });

print("✅ MongoDB inicializado com sucesso!");
print("📊 Banco de dados: dataplane");
print("👤 Usuário: dataplane_user");
print("🗂️  Coleção: ai_requests"); 