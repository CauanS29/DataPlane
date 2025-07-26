#!/bin/bash

# Script de inicialização do DataPlane WebApp

echo "🚀 Iniciando DataPlane WebApp..."

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js 18+"
    exit 1
fi

# Verifica a versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verifica se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Verifica se o arquivo package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado. Execute este script na pasta do projeto"
    exit 1
fi

# Verifica se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
fi

# Verifica se o arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    if [ -f "env.example" ]; then
        echo "📝 Criando arquivo .env.local..."
        cp env.example .env.local
        echo "✅ Arquivo .env.local criado. Edite-o se necessário."
    else
        echo "⚠️  Arquivo env.example não encontrado"
    fi
fi

# Verifica se a API está rodando
echo "🔍 Verificando conectividade com a API..."
if command -v curl &> /dev/null; then
    API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}
    if curl -s "$API_URL/api/v1/health" > /dev/null; then
        echo "✅ API está rodando em $API_URL"
    else
        echo "⚠️  API não está respondendo em $API_URL"
        echo "💡 Certifique-se de que a API DataPlane está rodando"
    fi
else
    echo "⚠️  curl não encontrado. Não foi possível verificar a API"
fi

# Inicia o servidor de desenvolvimento
echo "🌐 Iniciando servidor de desenvolvimento..."
echo "📍 A aplicação estará disponível em: http://localhost:3000"
echo "🔧 Modo de desenvolvimento ativo"
echo ""

npm run dev 