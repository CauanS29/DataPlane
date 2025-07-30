# 🔄 Collection Mesclada - DataPlane

Sistema para mesclar dados de **todas as tabelas relacionadas** numa collection unificada no MongoDB.

## 📋 Visão Geral

O sistema lê os arquivos CSV separados e cria uma **collection mesclada** (`ocorrencia_completa`) que inclui:

- ✈️ **Dados da Ocorrência** (principal)
- 🛩️ **Dados da Aeronave** (via `codigo_ocorrencia2`)
- 📋 **Tipos de Ocorrência** (via `codigo_ocorrencia1`)
- ⚠️ **Fatores Contribuintes** (via `codigo_ocorrencia3`)
- 📝 **Recomendações** (via `codigo_ocorrencia4`)

## 🗂️ Estrutura dos Dados

### Arquivos CSV Processados:
```
mongo-seeders/datasets/
├── ocorrencia.csv          # 📊 Dados principais
├── aeronave.csv           # 🛩️ Aeronaves envolvidas
├── ocorrencia_tipo.csv    # 📋 Tipos de ocorrência
├── fator_contribuinte.csv # ⚠️ Fatores contribuintes
└── recomendacao.csv       # 📝 Recomendações
```

### Relacionamentos (JOINs):
```sql
-- Estrutura conceitual dos JOINs
ocorrencia (principal)
├── LEFT JOIN aeronave ON ocorrencia.codigo_ocorrencia = aeronave.codigo_ocorrencia2
├── LEFT JOIN ocorrencia_tipo ON ocorrencia.codigo_ocorrencia1 = ocorrencia_tipo.codigo_ocorrencia1
├── LEFT JOIN fator_contribuinte ON ocorrencia.codigo_ocorrencia3 = fator_contribuinte.codigo_ocorrencia3
└── LEFT JOIN recomendacao ON ocorrencia.codigo_ocorrencia4 = recomendacao.codigo_ocorrencia4
```

## 🚀 Como Usar

### 1. Inicialização Automática (Docker)

O sistema agora **executa automaticamente** a criação da collection mesclada durante a inicialização:

```bash
# Inicia todo o sistema (MongoDB + API + Seeding completo)
docker-compose up

# Ou apenas o seeding completo
docker-compose up mongo-seeder
```

**Durante a inicialização, o sistema irá:**
1. ✅ Popular collections separadas (ocorrencia, aeronave, etc.)
2. ✅ Criar collection mesclada (ocorrencia_completa) automaticamente
3. ✅ Configurar índices e otimizações

### 2. Execução Manual (Desenvolvimento)

#### Seeding Completo
```bash
# Na raiz do projeto dataplane-api
python run_seeders.py
```

#### Apenas Collection Mesclada (Regeneração)
```bash
# Quando dados básicos já existem no MongoDB
python regenerate_merged_collection.py
```

#### Scripts Individuais
```bash
# Apenas seeding básico
python mongo-seeders/seed_database.py

# Apenas collection mesclada
python mongo-seeders/create_merged_collection.py

# Script interativo completo
python create_merged_data.py
```

### 2. Acessar via API

#### 📍 Dados Completos (Collection Mesclada)
```http
GET /api/v1/ocurrence/complete?limit=100&skip=0
```

**Resposta:**
```json
{
  "total": 15000,
  "ocurrences": [
    {
      // Dados da ocorrência
      "codigo_ocorrencia": "12345",
      "ocorrencia_latitude": -23.456,
      "ocorrencia_longitude": -46.789,
      "ocorrencia_classificacao": "ACIDENTE",
      
      // Dados da aeronave (mesclados)
      "aeronave_matricula": "PP-ABC",
      "aeronave_fabricante": "EMBRAER",
      "aeronave_modelo": "ERJ-190",
      "aeronave_ano_fabricacao": 2015,
      
      // Tipos de ocorrência (agrupados)
      "ocorrencia_tipo": "FALHA DE MOTOR; ERRO PILOTAGEM",
      "ocorrencia_tipo_categoria": "TÉCNICO; HUMANO",
      
      // Fatores contribuintes (agrupados)
      "fator_nome": "FADIGA MATERIAL; FALTA TREINAMENTO",
      "fator_area": "MANUTENÇÃO; OPERACIONAL",
      
      // Recomendações (agrupadas)
      "recomendacao_numero": "A-001/2023; A-002/2023",
      "recomendacao_conteudo": "Revisar processo... | Implementar treinamento...",
      "recomendacao_status": "EM ANDAMENTO; FECHADA"
    }
  ],
  "stats": {
    "total_ocorrencias": 15000,
    "com_coordenadas": 13185,
    "com_dados_aeronave": 12500,
    "com_recomendacoes": 8500,
    "percentual_completo": 83.33
  },
  "data_source": "merged_collection"
}
```

#### 📊 Estatísticas
```http
GET /api/v1/ocurrence/stats
```

#### 📍 Dados Básicos (Collection Separada)
```http
# Continua funcionando normalmente
GET /api/v1/ocurrence/coordinates?include_aeronaves=true
```

## 🔧 Arquivos Criados

### 1. **Script de Mesclagem**
```
dataplane-api/mongo-seeders/create_merged_collection.py
```
- Lê todos os CSVs
- Faz JOINs baseados nos códigos
- Cria collection `ocorrencia_completa`

### 2. **Serviço da Collection Mesclada**
```
dataplane-api/app/services/merged_ocurrence_service.py
```
- `get_merged_ocurrences_with_coordinates()`
- `count_merged_ocurrences_with_coordinates()`
- `get_merged_stats()`

### 3. **Endpoints do Controller**
```
dataplane-api/app/controllers/ocurrence_controller.py
```
- `GET /ocurrence/complete` - Dados completos
- `GET /ocurrence/stats` - Estatísticas
- `GET /ocurrence/coordinates` - Dados básicos (mantido)

### 4. **Script de Execução Simples**
```
dataplane-api/create_merged_data.py
```

### 5. **Scripts de Inicialização**
```
dataplane-api/run_seeders.py              # Executa seeding completo (usado pelo Docker)
dataplane-api/regenerate_merged_collection.py  # Apenas regenera collection mesclada
```

### 6. **Configuração Docker**
```
dataplane-api/docker-compose.yml          # Configurado para executar seeding automático
```

## 📈 Vantagens da Collection Mesclada

### ✅ **Performance**
- Uma única consulta para todos os dados
- Sem necessidade de múltiplos JOINs em tempo real
- Índices otimizados para busca

### ✅ **Completude**
- Dados de aeronaves, tipos, fatores e recomendações numa única resposta
- Informações contextuais completas para análise

### ✅ **Flexibilidade**
- Mantém collections originais intactas
- Endpoints separados para diferentes necessidades
- Fácil regeneração da collection mesclada

## 🔄 Regenerar Collection

Para atualizar a collection mesclada após mudanças nos CSVs:

```bash
# 1. Execute o seeding normal (se houver novos CSVs)
python mongo-seeders/seed_database.py

# 2. Regenere a collection mesclada
python create_merged_data.py
```

## 🎯 Casos de Uso

### **Frontend/Dashboard**
```javascript
// Busca dados completos para exibição detalhada
fetch('/api/v1/ocurrence/complete?limit=50')
  .then(res => res.json())
  .then(data => {
    // data.ocurrences contém TODOS os dados mesclados
    // Aeronaves, tipos, fatores, recomendações
  });
```

### **Análise de Dados**
```python
# Dados completos para análise estatística
import requests

response = requests.get('/api/v1/ocurrence/complete?limit=10000')
data = response.json()

for ocurrence in data['ocurrences']:
    # Acesso direto a todos os campos
    print(f"Aeronave: {ocurrence['aeronave_fabricante']}")
    print(f"Fatores: {ocurrence['fator_nome']}")
    print(f"Recomendações: {ocurrence['recomendacao_status']}")
```

### **Performance Crítica**
```http
# Para mapas com dados básicos (mais rápido)
GET /api/v1/ocurrence/coordinates?limit=20000

# Para análise completa (dados ricos)
GET /api/v1/ocurrence/complete?limit=1000
```

## 🚨 Observações Importantes

1. **Dados Agrupados**: Campos 1:N (tipos, fatores, recomendações) são unidos com `;`
2. **Primeira Aeronave**: Apenas a primeira aeronave por ocorrência é incluída
3. **Performance**: Collection mesclada é maior, use limits apropriados
4. **Sincronização**: Regenere após mudanças nos CSVs originais

---

## 📞 Suporte

Para dúvidas sobre a collection mesclada:
1. Verifique logs da API
2. Confirme conexão MongoDB
3. Valide arquivos CSV na pasta `datasets/` 