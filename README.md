# Gestão de usuario

Sistema web para controle de produção por setor, com histórico por processo, alertas de entrega e visão administrativa.

## Executar localmente

Pré-requisitos:
- Node.js 18+

Passos:
1. Instale as dependências:
   npm install
2. Configure variáveis de ambiente em `.env.local`:
   VITE_GEMINI_API_KEY=sua_chave
3. Inicie em desenvolvimento:
   npm run dev

## Build de produção

Para gerar build local:
- npm run build

## Deploy no Vercel

Este projeto já está preparado para Vercel com o arquivo `vercel.json`.

Passos:
1. Faça push do repositório para GitHub.
2. No Vercel, clique em New Project e importe o repositório.
3. Em Environment Variables, configure:
   VITE_GEMINI_API_KEY
4. Deploy.

Configuração usada:
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Rewrites SPA habilitado em `vercel.json`
