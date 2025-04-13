# ⭐ Footix - README

## 🌐 Visão Geral

**Footix** é um jogo de gerenciamento de clubes de futebol online. O universo é composto por servidores independentes com até 64 clubes cada, onde jogadores criam seus clubes, disputam competições, negociam atletas e evoluem ao longo das temporadas.

## 🧪 Tecnologias

- **Next.js 14 (App Router)**: base unificada para Web, Admin e API
- **Tailwind CSS (< v4)**: estilização com utilitários rápidos e responsivos
- **PWA com `next-pwa`**: permite rodar como app instalável no navegador
- **Supabase**: banco PostgreSQL, autenticação, storage, RLS e edge functions
- **pnpm + monorepo**: gerenciamento eficiente de pacotes e apps

```
/src
│
├── app
│   ├── api/                  ← Rotas de API REST (auth, clube, servidor...)
│   ├── (admin)/              ← Painel administrativo (com layout próprio)
│   ├── (web)/                ← App do jogador (responsivo, PWA-first)
│   ├── login/                ← Tela de login unificada
│   ├── layout.tsx           ← Layout raiz (ex: auth, toast, etc)
│   └── page.tsx             ← Redirecionamento conforme papel (admin/user)
│
├── lib/                     ← Funções utilitárias (supabase, auth, helpers)
├── components/              ← Componentes reutilizáveis (botões, cards, tabelas)
├── public/                  ← Manifest PWA, ícones
├── next.config.ts
└── manifest.json
```

## 🔄 Fluxo do Jogo

1. **Login com Google** (via Supabase Auth)
2. **Verificação de servidor com vaga**
3. **Criação de clube** com jogadores iniciais
4. **Abertura e fechamento de inscrições** no servidor
5. **Geração automática** de ligas e Copa Nacional
6. **Temporada em andamento**:
   - Jogos (liga + copa)
   - Transferências
   - Definição de tática, elenco
7. **Encerramento da temporada**:
   - Premiações e multas
   - Rebaixamento/promoção
   - Evolução de jogadores
   - Reabertura de inscrições

## 🗓️ Temporada

- Cada servidor possui um ciclo de temporada (40-45 dias estimados)
- Copa Nacional e Liga correm em paralelo
- A partir da 2ª temporada: divisões são organizadas por desempenho

## 🛠️ Painel Admin

- Criado em Next.js + Supabase
- Serve como:
  - Painel gerencial (criação de servidores, logs, reset de temporada)
  - API intermediária para o app

## 🗺️ ROADMAP DETALHADO

### 📁 FASE 1: Setup do Projeto e Infraestrutura Base

#### 1.1 Setup do Projeto Next.js

- [ ] Inicializar projeto Next.js 14
- [ ] Configurar TypeScript
- [ ] Configurar ESLint e Prettier
- [ ] Configurar Tailwind CSS v3
- [ ] Criar estrutura de pastas:
  - [ ] `/app` para rotas e páginas
  - [ ] `/components` para componentes reutilizáveis
  - [ ] `/lib` para utilitários e configurações

#### 1.2 Configuração do Supabase

- [ ] Criar projeto no Supabase
- [ ] Configurar autenticação Google
- [ ] Criar estrutura inicial do banco de dados
  - [ ] Tabelas base (users, servers, clubs)
  - [ ] Políticas de segurança (RLS)
  - [ ] Funções e triggers básicos
- [ ] Configurar storage para logos e imagens

### 🖥️ FASE 2: Desenvolvimento do Backend

#### 2.1 API Base

- [ ] Implementar rotas de API usando Next.js App Router:
  - [ ] `/api/auth/*` para autenticação
  - [ ] `/api/server/*` para gerenciamento de servidores
  - [ ] `/api/club/*` para operações de clube
  - [ ] `/api/admin/*` para endpoints administrativos
- [ ] Configurar middleware de autenticação e autorização
- [ ] Implementar validação de dados com Zod
- [ ] Configurar tratamento de erros global
- [ ] Implementar rate limiting e cache

#### 2.2 Sistema de Clubes

- [ ] Implementar endpoints de clube:
  - [ ] Criação de clube
  - [ ] Gerenciamento de elenco
  - [ ] Sistema de táticas
  - [ ] Finanças do clube
- [ ] Desenvolver lógica de negócio:
  - [ ] Cálculo de salários
  - [ ] Gestão de orçamento
  - [ ] Evolução de jogadores

#### 2.3 Sistema de Competições

- [ ] Implementar endpoints de competições:
  - [ ] Criação de ligas
  - [ ] Geração de calendário
  - [ ] Sistema de partidas
  - [ ] Classificação
- [ ] Desenvolver lógica de simulação:
  - [ ] Motor de partidas
  - [ ] Sistema de eventos
  - [ ] Estatísticas

### 💻 FASE 3: Desenvolvimento do Admin

#### 3.1 Interface Base

- [ ] Implementar layout administrativo:
  - [ ] Sidebar responsiva
  - [ ] Header com ações
  - [ ] Sistema de navegação
- [ ] Criar componentes base:
  - [ ] Tabelas de dados
  - [ ] Formulários
  - [ ] Cards e métricas
  - [ ] Gráficos e visualizações

#### 3.2 Funcionalidades Administrativas

- [ ] Implementar páginas de administração:
  - [ ] Dashboard com métricas
  - [ ] Gerenciamento de servidores
  - [ ] Controle de temporada
  - [ ] Logs e monitoramento
  - [ ] Gerenciamento de usuários
- [ ] Desenvolver funcionalidades:
  - [ ] CRUD de servidores
  - [ ] Configurações de simulação
  - [ ] Controle de temporada
  - [ ] Sistema de logs

### 📱 FASE 4: Interface Web do Jogador

#### 4.1 Interface Base

- [ ] Implementar layout do jogador:
  - [ ] Bottom navigation mobile
  - [ ] Header responsivo
  - [ ] Sistema de navegação
- [ ] Criar componentes base:
  - [ ] Cards de jogador
  - [ ] Tabelas de classificação
  - [ ] Calendário de jogos
  - [ ] Gráficos financeiros

#### 4.2 Páginas Principais

- [ ] Implementar páginas usando App Router:
  - [ ] `/login` com autenticação Google
  - [ ] `/server/select` para escolha de servidor
  - [ ] `/club/create` para criação de clube
  - [ ] `/dashboard` com layout responsivo
  - [ ] `/club/[id]` para detalhes do clube
  - [ ] `/tactics` para gerenciamento de táticas
  - [ ] `/transfers` para mercado de transferências

#### 4.3 Sistemas de Jogo

- [ ] Implementar funcionalidades:
  - [ ] Sistema de táticas
  - [ ] Mercado de transferências
  - [ ] Finanças do clube
  - [ ] Competições
  - [ ] Estatísticas

#### 4.4 Integração com Supabase

- [ ] Configurar cliente Supabase
- [ ] Implementar hooks personalizados:
  - [ ] `useAuth` para autenticação
  - [ ] `useClub` para dados do clube
  - [ ] `useServer` para dados do servidor
- [ ] Configurar realtime subscriptions:
  - [ ] Atualizações de partidas
  - [ ] Notificações de transferências
  - [ ] Alertas do sistema

### 🧪 FASE 5: Testes e Otimização

#### 5.1 Testes

- [ ] Configurar Jest e React Testing Library
- [ ] Implementar testes de API:
  - [ ] Testes de endpoints
  - [ ] Testes de middleware
- [ ] Implementar testes de componentes:
  - [ ] Testes de UI
  - [ ] Testes de integração
- [ ] Configurar testes E2E com Cypress

#### 5.2 Otimização

- [ ] Implementar otimizações de performance:
  - [ ] Lazy loading de componentes
  - [ ] Otimização de imagens
  - [ ] Compressão de assets
- [ ] Otimizar queries Supabase:
  - [ ] Índices
  - [ ] Cache
  - [ ] Paginação

### 🚀 FASE 6: Deploy e Monitoramento

#### 6.1 Deploy

- [ ] Configurar CI/CD:
  - [ ] GitHub Actions
  - [ ] Deploy automático
  - [ ] Ambiente de staging
- [ ] Configurar Vercel:
  - [ ] Domínios
  - [ ] SSL
  - [ ] Edge Functions

#### 6.2 Monitoramento

- [ ] Implementar sistema de logs:
  - [ ] Logs de aplicação
  - [ ] Logs de erro
  - [ ] Logs de performance
- [ ] Configurar monitoramento:
  - [ ] Alertas
  - [ ] Métricas
  - [ ] Analytics

## 🏁 MVP – Entregáveis Finais

1. **Funcionalidades Básicas**

   - Login + entrada no servidor
   - Criação de clube com jogadores
   - Temporada com liga e copa
   - Sistema de táticas + evolução
   - Transferências com janelas
   - Encerramento com premiações e multas

2. **Painel Administrativo**

   - Interface funcional
   - Sistema de logs
   - Controle de temporada

3. **Interface do Jogador**
   - App responsivo e PWA
   - Navegação intuitiva
   - Sistema de notificações
