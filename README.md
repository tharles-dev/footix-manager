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
├── app/                      ← Rotas e páginas (App Router)
│   ├── api/                  ← Rotas de API REST
│   │   ├── admin/            ← Endpoints administrativos
│   │   ├── auth/             ← Autenticação
│   │   ├── club/             ← Operações de clube
│   │   ├── clubs/            ← Operações de clubes
│   │   ├── competitions/     ← Competições
│   │   ├── players/          ← Jogadores
│   │   ├── server/           ← Servidores
│   │   ├── transfer/         ← Transferências
│   │   └── user/             ← Usuários
│   ├── admin/                ← Painel administrativo
│   ├── auth/                 ← Autenticação e login
│   ├── server/               ← Páginas de servidor
│   ├── web/                  ← App do jogador
│   │   ├── auctions/         ← Leilões
│   │   ├── dashboard/        ← Dashboard
│   │   └── transfers/        ← Transferências
│   ├── layout.tsx            ← Layout raiz
│   └── page.tsx              ← Redirecionamento conforme papel
│
├── components/               ← Componentes reutilizáveis
│   ├── admin/                ← Componentes do painel admin
│   ├── auth/                 ← Componentes de autenticação
│   ├── dashboard/            ← Componentes do dashboard
│   ├── layout/               ← Componentes de layout
│   ├── loaders/              ← Componentes de carregamento
│   ├── pack/                 ← Componentes de pacotes
│   ├── player/               ← Componentes de jogador
│   ├── squad/                ← Componentes de elenco
│   ├── tactics/              ← Componentes de táticas
│   ├── transfers/            ← Componentes de transferências
│   ├── ui/                   ← Componentes de UI
│   └── user/                 ← Componentes de usuário
│
├── contexts/                 ← Contextos React
├── hooks/                    ← Hooks personalizados
├── lib/                      ← Funções utilitárias
│   ├── api/                  ← Funções de API
│   ├── auth/                 ← Funções de autenticação
│   ├── supabase/             ← Configuração do Supabase
│   ├── types/                ← Tipos TypeScript
│   ├── utils/                ← Funções utilitárias
│   ├── validations/          ← Validações
│   ├── auction-utils.ts      ← Utilitários de leilões
│   ├── database.types.ts     ← Tipos do banco de dados
│   ├── fonts.ts              ← Configuração de fontes
│   └── utils.ts              ← Utilitários gerais
├── types/                    ← Tipos TypeScript
└── utils/                    ← Funções utilitárias
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

## 🗺️ ROADMAP DETALHADO

### 📁 FASE 1: Setup do Projeto e Infraestrutura Base

#### 1.1 Setup do Projeto Next.js

- [x] Inicializar projeto Next.js 14
- [x] Configurar TypeScript
- [x] Configurar ESLint e Prettier
- [x] Configurar Tailwind CSS v3
- [x] Criar estrutura de pastas:
  - [x] `/app` para rotas e páginas
  - [x] `/components` para componentes reutilizáveis
  - [x] `/lib` para utilitários e configurações

#### 1.2 Configuração do Supabase

- [x] Criar projeto no Supabase
- [x] Configurar autenticação Google
- [x] Criar estrutura inicial do banco de dados
  - [x] Tabelas base (users, servers, clubs)
  - [x] Políticas de segurança (RLS)
  - [x] Funções e triggers básicos
- [x] Configurar storage para logos e imagens (usando URLs externas)

### 🖥️ FASE 2: Desenvolvimento do Backend

#### 2.1 API Base

- [x] Implementar rotas de API usando Next.js App Router:
  - [x] `/api/auth/*` para autenticação
  - [x] `/api/server/*` para gerenciamento de servidores
  - [x] `/api/club/*` para operações de clube
  - [x] `/api/admin/*` para endpoints administrativos
- [x] Configurar middleware de autenticação e autorização
- [x] Implementar validação de dados com Zod
- [x] Configurar tratamento de erros global
- [x] Implementar rate limiting e cache

#### 2.2 Sistema de Clubes

- [x] Implementar endpoints de clube:
  - [x] Criação de clube (com validações e valores iniciais)
  - [x] Gerenciamento de elenco (contratação de jogadores livres)
  - [x] Sistema de táticas (formação, escalação, capitão)
  - [x] Finanças do clube
    - [x] Cálculo de Salários
    - [x] Processamento mensal
    - [x] Verificação de teto salarial
    - [x] Multas automáticas
    - [x] Bônus por desempenho
  - [x] Sistema de multas (cartões vermelhos, teto salarial)
    - [x] Registro de multas
    - [x] Cálculo automático de valores
    - [x] Notificações para clubes
    - [x] Pagamento de multas
  - [x] Sistema de Empréstimos
    - [x] Registro de empréstimos
    - [x] Controle de pagamentos
    - [x] Histórico de transações
  - [x] Gestão de orçamento
    - [x] Registro de despesas
    - [x] Registro de receitas
    - [x] Acompanhamento de saldo
    - [x] Projeções financeiras
    - [x] Cálculo automático de receitas
    - [x] Relatórios financeiros
- [x] Evolução de jogadores
  - [x] Sistema de XP
  - [x] Evolução de atributos
  - [x] Bônus de performance
  - [x] Atualização de valores de mercado

#### 2.3 Sistema de Competições

- [x] Criação de competições
- [x] Gerenciamento de partidas
- [x] Sistema de pontuação
- [x] Classificação
- [x] Playoffs
  - [x] Criação de playoffs
  - [x] Gerenciamento de partidas
  - [x] Registro de resultados
  - [x] Atualização automática de rankings
  - [x] Histórico de campeões
- [x] Sistema de rebaixamento
  - [x] Criação de divisões
  - [x] Processamento de promoções/rebaixamentos
  - [x] Histórico de movimentações
- [x] Sistema de premiações

#### 2.4 Sistema de Transferências

- [ ] Implementar fluxo completo de negociação de jogadores:
  - [ ] **Verificação Inicial:**
    - [ ] Consulta à tabela `servers` para obter configurações de mercado
    - [ ] Consulta à tabela `server_players` para verificar disponibilidade do jogador
    - [ ] Consulta à tabela `clubs` para verificar saldo e teto salarial
  - [ ] **Cálculo de Valores:**
    - [ ] Cálculo do valor de mercado baseado no salário e `market_value_multiplier`
    - [ ] Verificação se o salário está dentro dos limites permitidos
    - [ ] Cálculo do custo total do contrato (salário × duração)
  - [ ] **Processamento da Transação:**
    - [ ] Criação de registro na tabela `transfers`
    - [ ] Atualização do saldo na tabela `clubs`
    - [ ] Registro da transação na tabela `financial_transactions`
    - [ ] Atualização do contrato do jogador na tabela `server_players`
  - [ ] **Atualização Financeira:**
    - [ ] Registro da despesa na tabela `club_expenses`
    - [ ] Atualização do saldo total do clube
- [ ] Implementar endpoints de transferência:
  - [ ] `/api/transfer/hire` para contratação de jogadores livres
  - [ ] `/api/transfer/sell` para venda de jogadores
  - [ ] `/api/transfer/request` para envio de propostas
  - [ ] `/api/transfer/accept` para aceitação de propostas
  - [ ] `/api/transfer/pay-clause` para pagamento de cláusula de rescisão
  - [ ] `/api/transfer/auction` para leilões de jogadores
- [ ] Implementar validações de negociação:
  - [ ] Verificação de janela de transferências
  - [ ] Verificação de teto salarial
  - [ ] Verificação de saldo suficiente
  - [ ] Verificação de disponibilidade do jogador
- [ ] Implementar notificações de transferência:
  - [ ] Notificação para o clube vendedor
  - [ ] Notificação para o clube comprador
  - [ ] Notificação para o jogador

### 💻 FASE 3: Desenvolvimento do Admin

#### 3.1 Interface Base

- [x] Implementar layout administrativo:
  - [x] Sidebar responsiva
  - [x] Header com ações
  - [x] Sistema de navegação
- [x] Criar componentes base:
  - [x] Tabelas de dados
  - [ ] Formulários
  - [ ] Cards e métricas
  - [ ] Gráficos e visualizações

#### 3.2 Funcionalidades Administrativas

- [ ] Implementar páginas de administração:
  - [ ] Dashboard com métricas
  - [x] Gerenciamento de servidores
  - [ ] Controle de temporada
  - [ ] Logs e monitoramento
  - [ ] Gerenciamento de usuários
- [x] Desenvolver funcionalidades:
  - [x] CRUD de servidores
  - [ ] Configurações de simulação
  - [ ] Controle de temporada
  - [ ] Sistema de logs

### 📱 FASE 4: Interface Web do Jogador

#### 4.1 Interface Base

- [x] Implementar layout do jogador:
  - [x] Bottom navigation mobile
  - [x] Header responsivo
  - [x] Sistema de navegação
- [x] Criar componentes base:
  - [ ] Cards de jogador
  - [ ] Tabelas de classificação
  - [ ] Calendário de jogos
  - [ ] Gráficos financeiros

#### 4.2 Páginas Principais

- [ ] Implementar páginas usando App Router:
  - [x] `/auth` com autenticação Google
  - [x] `/club/create` para criação de clube
  - [x] `/dashboard` com layout responsivo
  - [x] `/tactics` para gerenciamento de táticas
  - [ ] `/transfers` para mercado de transferências

#### 4.3 Sistemas de Jogo

- [ ] Implementar funcionalidades:
  - [x] Sistema de táticas
  - [ ] Mercado de transferências
  - [ ] Finanças do clube
  - [ ] Competições
  - [ ] Estatísticas

#### 4.4 Integração com Supabase

- [x] Configurar cliente Supabase
- [x] Implementar hooks personalizados:
  - [x] `useAuth` para autenticação
  - [x] `useSettings` para configurações
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
