# Datasets para Seeding do MongoDB

Esta pasta contém os arquivos CSV que serão usados para popular o banco de dados MongoDB.

## 📁 Estrutura

```
mongo-seeders/
├── datasets/           # Pasta com arquivos CSV
│   ├── users.csv      # Coleção: users
│   ├── products.csv   # Coleção: products
│   ├── categories.csv # Coleção: categories
│   └── README.md      # Este arquivo
├── seed_database.py   # Script principal de seeding
└── __init__.py
```

## 📊 Como Funciona

1. **Nome da Coleção**: O nome da coleção no MongoDB será o nome do arquivo CSV (sem extensão)
   - `users.csv` → coleção `users`
   - `products.csv` → coleção `products`

2. **Metadados Automáticos**: Cada documento terá metadados adicionados automaticamente:
   - `_source`: Nome do arquivo CSV de origem
   - `_seeded_at`: Timestamp de quando foi inserido

3. **Índices Automáticos**: Índices são criados automaticamente para:
   - `_source`
   - `_seeded_at`
   - Campos comuns: `id`, `name`, `title`, `created_at`, `updated_at`

## 🚀 Como Usar

### 1. Adicione seus arquivos CSV
Coloque seus arquivos CSV nesta pasta. Exemplo:

```csv
# users.csv
id,name,email,created_at
1,João Silva,joao@email.com,2024-01-01
2,Maria Santos,maria@email.com,2024-01-02
```

### 2. Execute o seeding
```bash
# A partir da raiz do projeto
python mongo-seeders/seed_database.py

# Ou dentro da pasta de seeders
cd mongo-seeders
python seed_database.py
```

### 3. Com Docker
```bash
# Executa o seeding dentro do container
docker-compose exec api python mongo-seeders/seed_database.py
```

## 📋 Exemplos de Arquivos CSV

### users.csv
```csv
id,name,email,role,created_at
1,João Silva,joao@email.com,admin,2024-01-01T00:00:00Z
2,Maria Santos,maria@email.com,user,2024-01-02T00:00:00Z
3,Pedro Costa,pedro@email.com,user,2024-01-03T00:00:00Z
```

### products.csv
```csv
id,name,price,category_id,description
1,Laptop Dell,2500.00,1,Notebook Dell Inspiron
2,Smartphone Samsung,1200.00,2,Celular Samsung Galaxy
3,Headphones Sony,300.00,3,Fones de ouvido Sony
```

### categories.csv
```csv
id,name,description
1,Computadores,Produtos de informática
2,Smartphones,Telefones celulares
3,Acessórios,Acessórios diversos
```

## 🔧 Configuração

O script usa as mesmas variáveis de ambiente da aplicação:

```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=dataplane
MONGODB_USERNAME=dataplane_user
MONGODB_PASSWORD=dataplane_password
MONGODB_AUTH_SOURCE=admin
```

## 📈 Resultado no MongoDB

Após o seeding, você terá coleções como:

```javascript
// Coleção: users
{
  "_id": ObjectId("..."),
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00Z",
  "_source": "users.csv",
  "_seeded_at": "2024-01-15T10:30:00Z"
}

// Coleção: products
{
  "_id": ObjectId("..."),
  "id": 1,
  "name": "Laptop Dell",
  "price": 2500.00,
  "category_id": 1,
  "description": "Notebook Dell Inspiron",
  "_source": "products.csv",
  "_seeded_at": "2024-01-15T10:30:00Z"
}
```

## ⚠️ Observações

- **Limpeza**: O script limpa a coleção antes de inserir novos dados
- **Encoding**: Use UTF-8 para caracteres especiais
- **Delimitador**: Use vírgula (,) como delimitador
- **Cabeçalho**: A primeira linha deve conter os nomes das colunas
- **Tamanho**: Arquivos muito grandes podem demorar para processar 