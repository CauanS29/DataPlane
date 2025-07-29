# DataPlane WebApp

Frontend React/Next.js para o sistema DataPlane com predição de IA e dashboard de acidentes aéreos.

## 🚀 Funcionalidades

### 📊 **Predição com IA**
- Formulário interativo para geração de texto
- Configuração de parâmetros (temperatura, top-p, comprimento)
- Visualização de resultados em tempo real
- Exportação de resultados (copiar/baixar)
- Histórico de predições
- **Autenticação automática** via variável de ambiente

### 📈 **Dashboard de Acidentes Aéreos**
- Visualização de estatísticas em tempo real
- Gráficos interativos por severidade e fase
- Filtros avançados (data, severidade, fase, país)
- Lista detalhada de acidentes
- Modal com detalhes completos
- Exportação de dados em CSV
- Mapa interativo (preparado para implementação)

## 🔐 Autenticação da API

### Configuração do API Token

O token de autenticação é configurado via **variável de ambiente**:

```bash
# .env.local
NEXT_PUBLIC_API_TOKEN=seu_token_aqui
```

### Fluxo de Autenticação

```typescript
// O token é automaticamente obtido da variável de ambiente
const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;

// Interceptor adiciona o header Authorization
config.headers.Authorization = `Bearer ${apiToken}`;

// Verificação automática de conectividade
const isConnected = await apiClient.testConnectionWithAuth();
```

### Indicadores de Status

- 🟢 **Verde**: API conectada e autenticada
- 🔴 **Vermelho**: API desconectada ou erro de autenticação
- **Clique no status** para testar a conexão manualmente

### Tratamento de Erros

- **401 Unauthorized**: Token inválido ou expirado
- **422 Validation Error**: Parâmetros inválidos
- **500 Server Error**: Erro interno da API
- **Network Error**: API indisponível

## 🏗️ Arquitetura

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── Header.tsx        # Header com navegação e status da API
│   ├── PredictionPage.tsx # Página de predição
│   └── DashboardPage.tsx  # Página do dashboard
├── lib/                  # Utilitários e configurações
│   ├── api.ts            # Cliente da API com autenticação automática
│   └── utils.ts          # Funções utilitárias
├── store/                # Gerenciamento de estado
│   └── index.ts          # Stores Zustand
├── hooks/                # Hooks personalizados
│   └── useApiAuth.ts     # Hook para verificação de conectividade
└── types/                # Tipos TypeScript
    └── index.ts          # Interfaces e tipos
```

## 🛠️ Tecnologias

- **Framework**: Next.js 15.4.3
- **UI**: React 19.1.0 + TypeScript
- **Estilização**: Tailwind CSS 4
- **Estado**: Zustand
- **Formulários**: React Hook Form
- **Notificações**: React Hot Toast
- **Gráficos**: Plotly.js + Recharts
- **Mapas**: Leaflet (preparado)
- **Ícones**: Lucide React
- **HTTP**: Axios com interceptors

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- API DataPlane rodando (porta 8000)

### 1. Clone e instale dependências
```bash
cd dataplane-webapp
npm install
```

### 2. Configure as variáveis de ambiente
```bash
cp env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

**Variáveis obrigatórias:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TOKEN=seu_token_aqui
```

### 3. Execute em desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🐳 Docker

### Build da imagem
```bash
docker build -t dataplane-webapp .
```

### Executar container
```bash
# Configure as variáveis de ambiente
export NEXT_PUBLIC_API_TOKEN=seu_token_aqui
docker run -p 3000:3000 -e NEXT_PUBLIC_API_TOKEN=$NEXT_PUBLIC_API_TOKEN dataplane-webapp
```

### Docker Compose
```bash
# Configure as variáveis de ambiente
export NEXT_PUBLIC_API_TOKEN=seu_token_aqui

# Produção
docker-compose up webapp

# Desenvolvimento
docker-compose up webapp-dev
```

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL da API DataPlane | Sim | `http://localhost:8000` |
| `NEXT_PUBLIC_API_TOKEN` | Token de autenticação da API | Sim | - |
| `NODE_ENV` | Ambiente de execução | Não | `development` |
| `NEXT_PUBLIC_APP_NAME` | Nome da aplicação | Não | `DataPlane` |

### Configuração da API

1. **Configure o API Token** na variável de ambiente
2. **Verifique a conectividade** no header da aplicação
3. **Teste as predições** com diferentes prompts

## 📱 Uso da Aplicação

### Configuração Inicial

1. **Inicie a API DataPlane** (porta 8000)
2. **Configure o API Token** na variável de ambiente
3. **Acesse o frontend** (porta 3000)
4. **Verifique o status** da API no header

### Predição com IA

1. **Verifique se a API está conectada** (status verde no header)
2. **Digite um prompt** no campo de texto
3. **Ajuste os parâmetros**:
   - **Comprimento Máximo**: Número de tokens (1-1000)
   - **Temperatura**: Criatividade (0-2)
   - **Top P**: Diversidade (0-1)
   - **Amostragem**: Habilita/desabilita
4. **Clique em "Gerar Predição"**
5. **Visualize o resultado** e exporte se necessário

### Dashboard

1. **Visualize estatísticas** nos cards superiores
2. **Use os filtros** para refinar os dados
3. **Explore os gráficos** por severidade e fase
4. **Clique em um acidente** para ver detalhes
5. **Exporte os dados** em CSV

## 🎨 Componentes UI

### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Clique aqui
</Button>
```

### Input
```tsx
<Input 
  label="Nome" 
  placeholder="Digite seu nome"
  error={errors.name?.message}
/>
```

### Textarea
```tsx
<Textarea 
  label="Descrição" 
  rows={4}
  placeholder="Digite a descrição"
/>
```

## 🔄 Estado Global

### AppStore (Zustand)
```typescript
const { 
  currentView, 
  isAuthenticated,  // Status da conectividade
  accidents, 
  loading,
  setCurrentView,
  testApiConnection // Testa conectividade
} = useAppStore();
```

### DashboardStore
```typescript
const { 
  filters, 
  setFilters, 
  resetFilters 
} = useDashboardStore();
```

### Hook de Autenticação
```typescript
const {
  isAuthenticated,
  isChecking,
  checkAuth,
  refreshAuth
} = useApiAuth();
```

## 📊 Dados de Exemplo

O dashboard inclui dados de exemplo de acidentes aéreos:

- **São Paulo**: Boeing 737, pouso, pista molhada
- **Rio de Janeiro**: Airbus A320, decolagem, falha no motor
- **Brasília**: Embraer E190, cruzeiro, turbulência

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t dataplane-webapp .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.seu-dominio.com \
  -e NEXT_PUBLIC_API_TOKEN=seu_token_aqui \
  dataplane-webapp
```

### Produção
1. Configure `NODE_ENV=production`
2. Defina `NEXT_PUBLIC_API_URL` para sua API
3. Configure `NEXT_PUBLIC_API_TOKEN` com o token correto
4. Configure HTTPS
5. Configure CDN se necessário

## 🔍 Troubleshooting

### Problemas de Autenticação

1. **Token não configurado**:
   - Verifique se `NEXT_PUBLIC_API_TOKEN` está definido
   - Confirme se o token está correto
   - Verifique se a API está rodando

2. **API não responde**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

3. **Erro 401**:
   - Token inválido ou expirado
   - Verifique se o token na API é o mesmo do frontend
   - Confirme se a API aceita o token

### Problemas de Conectividade

1. **Verifique se a API está rodando**:
```bash
curl http://localhost:8000/api/v1/health
```

2. **Configure o token**: Defina `NEXT_PUBLIC_API_TOKEN` na variável de ambiente
3. **Verifique CORS**: API deve permitir origem do frontend

### Problemas de Build

1. **Limpe cache**: `rm -rf .next node_modules`
2. **Reinstale dependências**: `npm install`
3. **Verifique TypeScript**: `npm run lint`

### Problemas de Performance

1. **Otimize imagens**: Use formatos WebP/AVIF
2. **Lazy loading**: Implemente para componentes pesados
3. **Code splitting**: Divida bundles grandes

## 🔐 Segurança

### Boas Práticas

1. **Nunca exponha tokens** em logs ou console
2. **Use HTTPS** em produção
3. **Configure CORS** adequadamente na API
4. **Valide tokens** no servidor
5. **Implemente rate limiting** na API
6. **Use variáveis de ambiente** para tokens

### Armazenamento de Token

- **Variável de ambiente**: Configurada no servidor/container
- **Build time**: Token é embutido no build do Next.js
- **Runtime**: Token não é exposto no cliente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [Plotly.js](https://plotly.com/javascript/)
