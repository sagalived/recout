# Gestão de Produção

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

## Persistência em Produção (Vercel)

Para salvar cadastros, processos e mídias em produção (nuvem), o projeto usa API serverless + Vercel Postgres.

Passos no Vercel:
1. Abra o projeto no Vercel.
2. Vá em Storage e crie/associe um banco Vercel Postgres.
3. Confirme que as variáveis de banco foram adicionadas automaticamente ao projeto.
4. Faça novo deploy.

Com isso, o sistema:
- carrega o snapshot remoto ao abrir a aplicação;
- salva automaticamente mudanças na nuvem a cada poucos segundos;
- mantém cadastros, processos e arquivos de evolução persistidos entre acessos/dispositivos.

Configuração usada:
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Rewrites SPA habilitado em `vercel.json`
