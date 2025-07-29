# DataPlane API

API para processamento de dados com IA pré-treinada usando FastAPI e MongoDB.

## 🏗️ Arquitetura

A aplicação segue uma arquitetura modular com separação clara de responsabilidades:

```
dataplane-api/
├── app/
│   ├── config/          # Configurações da aplicação
│   ├── controllers/     # Controladores HTTP
│   ├── middleware/      # Middlewares (CORS, API Token, Logging)
│   ├── models/          # Modelos de dados e schemas
│   ├── routes/          # Roteamento da API
│   ├── services/        # Lógica de negócio
│   └── utils/           # Utilitários
├── logs/                # Logs da aplicação
├── models/              # Checkpoints dos modelos de IA
├── mongo-init/          # Scripts de inicialização do MongoDB
├── mongo-seeders/       # Seeders para popular o banco
│   ├── datasets/        # Arquivos CSV para seeding
│   └── seed_database.py # Script principal de seeding
├── main.py              # Ponto de entrada da aplicação
├── requirements.txt     # Dependências Python
└── env.example          # Exemplo de variáveis de ambiente
```

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd dataplane-api
```

2. **Crie um ambiente virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

5. **Setup do MongoDB**
```bash
python setup_mongodb.py
```

6. **Execute a aplicação**
```bash
python start.py
# ou
uvicorn main:app --reload
```

## 📋 Endpoints da API

### Health Check
- `GET /api/v1/health` - Health check básico
- `GET /api/v1/health/detailed` - Health check detalhado
- `GET /api/v1/health/ai` - Health check do serviço de IA

### IA
- `POST /api/v1/ai/generate` - Geração de texto com IA
- `GET /api/v1/ai/model/info` - Informações do modelo
- `POST /api/v1/ai/model/load` - Carregar modelo na memória
- `POST /api/v1/ai/model/unload` - Descarregar modelo
- `GET /api/v1/ai/history` - Histórico de gerações

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `API_TOKEN` | Token de autenticação da API | `your-api-token-here` |
| `MONGODB_URL` | URL do MongoDB | `mongodb://localhost:27017` |
| `MONGODB_DB` | Nome do banco de dados | `dataplane` |
| `MONGODB_USERNAME` | Usuário do MongoDB | `dataplane_user` |
| `MONGODB_PASSWORD` | Senha do MongoDB | `dataplane_password` |
| `MONGODB_AUTH_SOURCE` | Database de autenticação | `admin` |
| `AI_MODEL_NAME` | Nome do modelo de IA | `gpt2` |
| `AI_MODEL_PATH` | Caminho para checkpoint | `./models/checkpoint` |
| `DEBUG` | Modo debug | `false` |

### Modelos de IA

A aplicação suporta modelos do Hugging Face Transformers. Para usar um modelo personalizado:

1. Coloque o checkpoint do modelo em `./models/checkpoint/`
2. Configure `AI_MODEL_NAME` no arquivo `.env`
3. Reinicie a aplicação

## 🔐 Autenticação

A API usa autenticação simples com API Token:

1. **Configure o token**: Defina `API_TOKEN` no arquivo `.env`
2. **Use o token**: Inclua `Authorization: Bearer <seu-api-token>` nos headers

Exemplo:
```bash
curl -H "Authorization: Bearer seu-api-token" \
     -X POST "http://localhost:8000/api/v1/ai/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello world"}'
```

## 📊 Banco de Dados

A aplicação usa **MongoDB** com autenticação para armazenar:
- Histórico de requisições de IA
- Métricas de performance
- Dados populados via seeders

### MongoDB Local (Docker)

#### Setup Automático
```bash
# Setup completo com autenticação
python setup_mongodb.py
```

#### Setup Manual
```bash
# Inicia MongoDB com autenticação
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin_password \
  -e MONGO_INITDB_DATABASE=dataplane \
  mongo:7

# Cria usuário da aplicação
docker exec mongodb mongosh --username admin --password admin_password --authenticationDatabase admin --eval "
  db = db.getSiblingDB('dataplane');
  db.createUser({
    user: 'dataplane_user',
    pwd: 'dataplane_password',
    roles: [{ role: 'readWrite', db: 'dataplane' }]
  });
  db.createCollection('ai_requests');
"
```

#### Docker Compose
```bash
# Inicia tudo (API + MongoDB)
docker-compose up -d

# Ou apenas MongoDB
docker-compose up -d mongodb
```

### Credenciais do MongoDB

- **Usuário root**: `admin` / `admin_password`
- **Usuário da aplicação**: `dataplane_user` / `dataplane_password`
- **Banco de dados**: `dataplane`
- **Coleção**: `ai_requests`

## 🌱 Seeders do MongoDB

O projeto inclui um sistema de seeders para popular o banco de dados com dados de arquivos CSV.

### Estrutura dos Seeders

```
mongo-seeders/
├── datasets/           # Arquivos CSV
│   ├── users.csv      # → coleção 'users'
│   ├── products.csv   # → coleção 'products'
│   └── categories.csv # → coleção 'categories'
└── seed_database.py   # Script principal
```

### Como Usar os Seeders

#### 1. Adicione seus arquivos CSV
Coloque arquivos CSV na pasta `mongo-seeders/datasets/`. O nome do arquivo será o nome da coleção.

```csv
# users.csv
id,name,email,role,created_at
1,João Silva,joao@email.com,admin,2024-01-01T00:00:00Z
2,Maria Santos,maria@email.com,user,2024-01-02T00:00:00Z
```

#### 2. Execute o seeding

**Localmente:**
```bash
python mongo-seeders/seed_database.py
```

**Com Docker:**
```bash
# Via script helper
python run_seeders.py

# Ou diretamente
docker-compose exec api python mongo-seeders/seed_database.py
```

#### 3. Verifique os dados
```bash
# Conecta ao MongoDB
docker exec mongodb mongosh --username dataplane_user --password dataplane_password --authenticationDatabase admin

# Lista as coleções
show collections

# Consulta os dados
db.users.find()
db.products.find()
```

### Metadados Automáticos

Cada documento inserido terá metadados adicionados automaticamente:

```javascript
{
  "_id": ObjectId("..."),
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "_source": "users.csv",        // Arquivo de origem
  "_seeded_at": "2024-01-15T10:30:00Z"  // Timestamp de inserção
}
```

### Índices Automáticos

O script cria automaticamente índices para:
- `_source`
- `_seeded_at`
- Campos comuns: `id`, `name`, `title`, `created_at`, `updated_at`

## 🧪 Testes

```bash
# Instalar dependências de teste
pip install pytest pytest-asyncio

# Executar testes
pytest
```

## 📝 Logs

Os logs são salvos em `logs/app.log` e também exibidos no console. Configurações:

- **Rotação**: 10MB por arquivo
- **Retenção**: 7 dias
- **Compressão**: ZIP

## 🚀 Deploy

### Docker

```bash
# Build da imagem
docker build -t dataplane-api .

# Executar com MongoDB
docker-compose up -d
```

### Produção

1. Configure `DEBUG=false`
2. Use um API token forte
3. Configure MongoDB de produção com autenticação
4. Use HTTPS
5. Configure rate limiting
6. Monitore logs e métricas

## 📊 Exemplo de Uso

### 1. Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### 2. Gerar Texto
```bash
curl -H "Authorization: Bearer seu-api-token" \
     -X POST "http://localhost:8000/api/v1/ai/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "O que é inteligência artificial?",
       "max_length": 100,
       "temperature": 0.7
     }'
```

### 3. Verificar Histórico
```bash
curl -H "Authorization: Bearer seu-api-token" \
     http://localhost:8000/api/v1/ai/history
```

## 🔧 Troubleshooting

### Problemas de Conexão com MongoDB

1. **Verifique se o MongoDB está rodando**:
```bash
docker ps | grep mongodb
```

2. **Teste a conexão**:
```bash
docker exec mongodb mongosh --username dataplane_user --password dataplane_password --authenticationDatabase admin
```

3. **Verifique as credenciais no .env**:
```bash
cat .env | grep MONGODB
```

### Problemas com Seeders

1. **Verifique se os arquivos CSV existem**:
```bash
ls -la mongo-seeders/datasets/
```

2. **Execute o seeding com logs detalhados**:
```bash
python mongo-seeders/seed_database.py
```

3. **Verifique a conectividade**:
```bash
python -c "
import asyncio
from mongo-seeders.seed_database import MongoDBSeeder
seeder = MongoDBSeeder()
asyncio.run(seeder.connect())
"
```

### Reset do MongoDB

```bash
# Para o container
docker stop mongodb

# Remove o container e volume
docker rm mongodb
docker volume rm dataplane_mongodb_data

# Reinicia o setup
python setup_mongodb.py

# Executa os seeders
python run_seeders.py
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 