# Dockerfile para o frontend Next.js

# Estágio de desenvolvimento
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
# Instala todas as dependências, incluindo as de desenvolvimento
RUN npm install
COPY . .
# O comando `npm run dev` será executado pelo docker-compose
EXPOSE 3000

# Estágio base para build de produção
FROM node:18-alpine AS base

# Instala dependências necessárias
RUN apk add --no-cache libc6-compat

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia o código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV production

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

# Define o usuário
USER nextjs

# Expõe a porta
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"] 