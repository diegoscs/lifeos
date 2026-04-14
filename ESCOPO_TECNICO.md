# LifeOS — Escopo Técnico v3.0

## 1. Visão geral

Sistema operacional pessoal. Notion como backend único. Next.js 15 como frontend. Supabase apenas para auth.

**Princípio central:** o dashboard tem que fazer sentido em 30 segundos toda manhã.

**Decisões arquiteturais:**
- Single-user first — sem multi-tenancy, sem billing, sem signup público no MVP
- Notion como backend único — zero banco próprio no Supabase para dados de negócio
- Supabase apenas para Auth — magic link, sessão única protegida
- n8n self-hosted local — automações gratuitas rodando no próprio computador
- Custo total: R$0/mês no MVP

---

## 2. Stack técnica

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| Next.js | 15 (App Router) | Framework principal, SSR, API Routes, middleware |
| TypeScript | 5.x | Tipagem estática em todo o projeto |
| Tailwind CSS | 3.x | Estilização utility-first |
| Radix UI | latest | Componentes acessíveis (Select, Dialog, Dropdown, Toast) |
| Recharts | 2.x | Gráficos: mapa de calor de hábitos, barras financeiras |
| SWR | 2.x | Data fetching com cache e revalidação automática |
| date-fns | 3.x | Manipulação de datas (streaks, filtros) |

### Backend e Integrações
| Tecnologia | Plano/Custo | Função |
|---|---|---|
| Notion API (SDK) | Free — sem limite | Fonte única de todos os dados |
| Supabase | Free tier | Somente Auth — magic link, sessão JWT |
| Gmail API | Free | Leitura e ações em e-mails via OAuth2 |
| Microsoft Graph API | Free | Leitura de e-mails Outlook via OAuth2 |
| Vercel Webhooks | Free (Hobby) | Status de deploy em tempo real |
| n8n Community | Free (self-hosted) | Motor de automações |
| Telegram Bot API | Free | Notificações e lembretes automáticos |
| Claude API | ~R$2-5/mês | Porquinho IA: parsing de gastos (opcional) |

### DevOps
| Ferramenta | Custo | Uso |
|---|---|---|
| Vercel | Free (Hobby) | Deploy automático em cada push para main |
| GitHub | Free | Repositório privado, CI/CD via Vercel |

---

## 3. Estrutura de pastas

```
lifeos/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx              # Tela de login (magic link)
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Shell: sidebar + topbar
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── tarefas/page.tsx
│   │   ├── habitos/page.tsx
│   │   ├── emails/page.tsx
│   │   ├── financas/page.tsx
│   │   ├── projetos/page.tsx
│   │   ├── clientes/page.tsx
│   │   └── semana/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/         # Supabase auth callbacks
│       ├── notion/
│       │   ├── tasks/route.ts          # GET, POST, PATCH /tasks
│       │   ├── habits/route.ts         # GET, POST /habits
│       │   ├── records/route.ts        # GET, POST /records
│       │   ├── projects/route.ts
│       │   ├── clients/route.ts
│       │   └── finance/route.ts
│       ├── gmail/route.ts
│       ├── outlook/route.ts
│       └── webhooks/
│           └── vercel/route.ts
├── components/
│   ├── ui/                             # Primitivos (Button, Card, Badge...)
│   ├── layout/                         # Sidebar, Topbar, Shell
│   ├── dashboard/                      # Cards do dashboard
│   ├── tasks/                          # Lista, item, form de tarefa
│   ├── habits/                         # Check-in, mapa de calor, streak
│   ├── emails/                         # Feed, item, painel de detalhe
│   ├── finance/                        # Cards financeiros, porquinho IA
│   └── projects/                       # Cards de projeto
├── lib/
│   ├── notion.ts                       # Cliente Notion API
│   ├── gmail.ts                        # Cliente Gmail API
│   ├── outlook.ts                      # Cliente MS Graph
│   ├── supabase.ts                     # Cliente Supabase
│   └── utils.ts                        # Helpers gerais
├── hooks/
│   ├── useTasks.ts
│   ├── useHabits.ts
│   └── useEmails.ts
├── types/
│   └── index.ts                        # Task, Habit, Project, Client...
├── middleware.ts                        # Proteção de rotas autenticadas
├── .claude/
│   └── CLAUDE.md                       # Este arquivo — lido pelo Claude Code
├── .env.local                          # Variáveis de ambiente (não commitar)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 4. Variáveis de ambiente

```env
# .env.local — NUNCA commitar este arquivo

# Notion
NOTION_API_KEY=secret_xxxx
NOTION_TASKS_DB=c3c5a8d1-caf6-83fa-af50-07061882df6a
NOTION_PROJECTS_DB=a7af95c4-1840-4814-9d5a-00d4dc51c9fe
NOTION_HABITS_DB=3d3561d4-17f6-4b3f-8cda-27739ead95b2
NOTION_RECORDS_DB=17994332-8fc2-4156-8950-ede6c3708b4c
NOTION_FINANCE_DB=b39d7b72-9886-49f5-9e0f-a88fe06c67d4
NOTION_CLIENTS_DB=385abbe8-bd12-4a32-b9b6-e7a604a94727

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Gmail OAuth2
GMAIL_CLIENT_ID=xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxx
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Microsoft Graph (Outlook)
OUTLOOK_CLIENT_ID=xxxx
OUTLOOK_CLIENT_SECRET=xxxx
OUTLOOK_TENANT_ID=common

# Vercel Webhook
VERCEL_WEBHOOK_SECRET=xxxx

# Claude API (opcional — Porquinho IA)
ANTHROPIC_API_KEY=sk-ant-xxxx

# App
NEXTAUTH_SECRET=xxxx
NEXTAUTH_URL=http://localhost:3000
```

---

## 5. Bancos de dados Notion

### Tasks Manager
| Campo | Tipo | Uso |
|---|---|---|
| Name | Title | Título da tarefa |
| Priority | Select: Alta/Média/Baixa | Barra lateral colorida |
| Status | Status: A fazer/Em andamento/Completada/Pausada | Filtra views |
| Due Date | Date | Filtra view Hoje e Esta semana |
| Project | Relation → Projetos DSCS | Tag do projeto na tarefa |
| Complete | Checkbox | Sincroniza o check no app |

### Projetos DSCS
| Campo | Tipo | Uso |
|---|---|---|
| Nome | Title | Nome do projeto |
| Status | Status: Não iniciada/Em andamento/Concluído | Badge de status |
| Categoria | Select: Cliente/Portfolio/Produto Próprio/Site | Filtro |
| Prioridade | Select: Alta/Média/Baixa | Ordenação |
| Prazo | Date | Indicador no card |
| Progresso % | Number | Barra de progresso (0-100) |
| Próxima ação | Rich Text | O que fazer agora |
| URL deploy | URL | Link do projeto em produção |

### Hábitos (configuração)
| Campo | Tipo | Uso |
|---|---|---|
| Nome | Title | Nome do hábito |
| Ativo | Checkbox | Filtra hábitos visíveis |
| Categoria | Select: Saúde/Produtividade/Pessoal | Agrupamento |
| Frequência | Select: Diário/Semanal | Lógica de streak |
| Horário | Select: Manhã/Tarde/Noite/Qualquer hora | Sugestão |
| Meta semanal | Number | Alvo de dias na semana |

### Registros de Hábitos (check-ins)
| Campo | Tipo | Uso |
|---|---|---|
| Registro | Title | Auto-gerado: "Academia - 2026-04-13" |
| Hábito | Select | Qual hábito foi registrado |
| Data | Date | Base para streak e mapa de calor |
| Concluído | Checkbox | true = verde, false = vermelho |
| Motivo falha | Rich Text | Preenchido quando Concluído = false |

### Financeiro
| Campo | Tipo | Uso |
|---|---|---|
| Descrição | Title | Descrição da movimentação |
| Tipo | Select: Receita/Gasto fixo/Gasto variável/Meta mensal/NF pendente | Separa entradas e saídas |
| Valor | Number (R$) | Base para cálculos |
| Data | Date | Data da movimentação |
| Status | Select: Pendente/Recebido/Pago/Vencendo | Alerta quando Vencendo |
| Categoria | Select: Projeto/Pessoal/Assinatura/Imposto/Outro | Relatório |

### Clientes
| Campo | Tipo | Uso |
|---|---|---|
| Nome | Title | Nome do cliente |
| Status | Select: Prospect/Ativo/Concluído/Pausado | Badge no card |
| Valor total | Number (R$) | Valor total do contrato |
| Contato | Rich Text | E-mail ou WhatsApp |
| Última interação | Date | Alerta se > 7 dias |
| Notas | Rich Text | Observações gerais |

---

## 6. Abas do aplicativo

### Dashboard
- 4 métricas: Tarefas hoje, Streak hábitos, Receita do mês, Projetos ativos
- Card Tarefas do dia — por prioridade, apenas pendentes + 2 últimas concluídas
- Card Hábitos — quadradinhos dos últimos 7 dias + streak
- Card E-mails novos — remetente + assunto + hora (sem botões de ação)
- Card Alertas — barra vermelha lateral, snooze, resolver
- Card Projetos — nome + próxima ação + barra de progresso
- Card Finanças — recebido, a receber, meta, projeção
- Card Deploys — últimos 3 com status
- **Regra:** dashboard é só visualização. Ações ficam nas abas dedicadas.

### Tarefas
- Views: Hoje / Esta semana / Backlog / Algum dia
- Criar inline: campo + Enter → POST Notion
- Marcar concluída: toggle → PATCH Status = Completada (optimistic update)
- Filtro por projeto e contexto (Trabalho/Pessoal)

### Hábitos
- View Hoje: check-in com círculo clicável, modal de motivo ao desmarcar
- View Semana: grade 7 colunas com cores
- View Mês: mapa de calor estilo GitHub
- Card padrões: análise dos últimos 30 dias

### E-mails
- Suporte: Gmail + Outlook (multi-conta)
- Feed unificado com indicador de origem por cor
- Views: Todos / Não lidos / Precisam ação / Arquivados
- Painel lateral: corpo + ações (arquivar, criar task, snooze, abrir original)
- Classificação automática por remetente

### Finanças
- Cards: Recebido, A receber, Gastos fixos, Meta, Projeção
- Porquinho IA: campo de texto → Claude API → salva no Notion
- Tabela de movimentações do mês com filtros
- Alerta de NF vencendo

### Projetos
- Cards: nome, status, progresso %, próxima ação, prazo, status deploy
- Views: Lista e Kanban (3 colunas por Status)
- Atualizar Próxima ação inline (click to edit)

### Clientes
- Cards com badge de status, valor total, última interação
- Alerta se última interação > 7 dias
- Filtro por Status

### Revisão Semanal
- Resumo automático gerado com dados reais da semana
- 3 campos de reflexão livre
- Campo de planejamento da próxima semana
- Histórico de semanas anteriores

---

## 7. Automações n8n

### Instalação local (gratuito)
```bash
docker run -it --rm --name n8n -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
# Acesso: http://localhost:5678
```

### Automação 1 — Lembrete matinal (alta prioridade)
- **Trigger:** Schedule — todo dia útil às 07:30
- Busca tarefas do dia via Notion API (Due Date = hoje, Status != Completada)
- Ordena por prioridade
- Envia no Telegram: "Bom dia! Suas 3 tarefas de hoje: ..."

### Automação 2 — Deploy falhou → task no Notion (alta prioridade)
- **Trigger:** Webhook da Vercel (evento: deployment.error)
- Extrai nome do projeto e URL dos logs
- Cria task: "Corrigir build falhando — [projeto]" com prioridade Alta
- Envia alerta no Telegram com link para os logs

### Automação 3 — Triagem automática de Gmail (alta prioridade)
- **Trigger:** Schedule — a cada 30 minutos
- Regras: Vercel/GitHub → label "automático", proposta/orçamento → "cliente"
- Arquiva newsletters automaticamente (detectadas por List-Unsubscribe header)

### Automação 4 — Relatório semanal (alta prioridade)
- **Trigger:** Schedule — todo domingo às 20:00
- Busca tarefas concluídas, registros de hábitos e receitas da semana
- Envia no Telegram e cria página de revisão no Notion

### Automação 5 — Check-in de sono (média prioridade)
- **Trigger:** Schedule — todo dia às 22:30
- Envia "Vai dormir agora? (sim/não)" no Telegram
- Aguarda resposta e cria registro no banco de Hábitos

### Automação 6 — Alerta de cliente sem contato (média prioridade)
- **Trigger:** Schedule — toda segunda às 09:00
- Busca clientes Ativos com Última interação > 7 dias
- Envia alerta no Telegram

### Automação 7 — Backup de queries SQL (média prioridade)
- **Trigger:** GitHub webhook — arquivo .sql commitado
- Cria nota no Notion com conteúdo, nome e link do commit

---

## 8. Passo a passo de desenvolvimento

### FASE 1 — Fundação e Auth (Semana 1 · ~8h)

**Passo 1.1 — Criar o projeto (30min)**
```bash
npx create-next-app@latest lifeos \
  --typescript --tailwind --app --src-dir=false \
  --import-alias "@/*"

cd lifeos
npm install @notionhq/client @supabase/supabase-js @supabase/ssr
npm install swr date-fns recharts
npm install @radix-ui/react-select @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-toast
npm install clsx tailwind-merge
npm install -D @types/node
```

**Passo 1.2 — Configurar Supabase Auth (1h)**
1. Criar projeto no supabase.com (free tier)
2. Ativar Email Auth > Magic Link em Authentication > Providers
3. Criar `lib/supabase.ts` com cliente server e client
4. Criar `middleware.ts` para proteger rotas do grupo `(dashboard)`
5. Criar `app/(auth)/login/page.tsx` com formulário de email
6. Testar fluxo: enviar magic link → clicar → redirecionar para `/`

**Passo 1.3 — Layout base com sidebar (2h)**
1. Criar `app/(dashboard)/layout.tsx` com Shell component
2. Criar `components/layout/Sidebar.tsx` — lista de navegação com pontos, sem ícones
3. Criar `components/layout/Topbar.tsx` — título, toggle Tudo/Trabalho/Pessoal, avatar
4. Sidebar: 180px largura, texto + dot ativo (design aprovado v5)

**Passo 1.4 — Configurar Notion API (1h)**
1. Criar integração em notion.so/my-integrations
2. Compartilhar workspace LifeOS com a integração
3. Criar `lib/notion.ts` com cliente e funções tipadas
4. Testar: buscar primeira tarefa do Tasks Manager

**Passo 1.5 — Deploy inicial na Vercel (30min)**
1. Conectar repo GitHub na Vercel
2. Adicionar todas as env vars em Settings > Environment Variables
3. Primeiro deploy — confirmar que a tela de login carrega

---

### FASE 2 — Dashboard + Hábitos + Tarefas (Semanas 2-3 · ~15h)

**Passo 2.1 — API Routes do Notion (2h)**
- `app/api/notion/tasks/route.ts` — GET (lista), POST (criar), PATCH (atualizar)
- `app/api/notion/habits/route.ts` — GET (configurações), POST (check-in)
- `app/api/notion/records/route.ts` — GET (registros por data), POST
- Tipar todas as respostas com interfaces em `types/index.ts`

**Passo 2.2 — Hooks SWR (1h)**
- `hooks/useTasks.ts` — useSWR + mutate para optimistic updates
- `hooks/useHabits.ts` — hábitos ativos e registros da semana

**Passo 2.3 — Aba Tarefas (3h)**
- Tabs: Hoje / Esta semana / Backlog / Algum dia
- `TaskItem`: checkbox, barra de prioridade, título, tag de projeto, data
- Checkbox: PATCH otimista — UI atualiza imediatamente, API em background
- Campo de adição inline: input + Enter = POST

**Passo 2.4 — Aba Hábitos (3h)**
- View Hoje: lista com círculo de check-in
- Modal de motivo: 4 opções (Dormiu tarde, Compromisso, Esqueceu, Não quis) + pular
- View Semana: grade 7 colunas com cores
- View Mês: mapa de calor com Recharts
- Card padrões: calcular taxa por hábito nos últimos 30 dias

**Passo 2.5 — Dashboard principal (3h)**
- 4 cards de métricas
- Card tarefas: dados da API
- Card hábitos: quadradinhos dos últimos 7 dias
- Card e-mails: placeholder "Configure sua conta de e-mail"
- Card alertas, projetos, finanças, deploys (placeholder até Fase 3)

**Passo 2.6 — Onboarding (1h)**
- Verificar primeiro acesso (sem dados no Notion)
- Modal de 3 passos: Notion conectado / Configure Gmail / Seus 2 primeiros hábitos
- Estados vazios amigáveis em cada aba

---

### FASE 3 — E-mails + Financeiro (Semanas 4-5 · ~15h)

**Passo 3.1 — Gmail OAuth2 (2h)**
1. Criar projeto no Google Cloud Console
2. Ativar Gmail API
3. Configurar OAuth consent screen e credenciais
4. Criar rotas `/api/auth/gmail/connect` e `/api/auth/gmail/callback`
5. Salvar refresh_token no Supabase (tabela `email_tokens`)

**Passo 3.2 — Outlook OAuth2 (1h30)**
1. Registrar app no portal Azure (portal.azure.com)
2. Permissões: Mail.Read, Mail.ReadWrite, offline_access
3. Criar rotas `/api/auth/outlook/connect` e `/api/auth/outlook/callback`

**Passo 3.3 — API de e-mails unificada (2h)**
- `lib/gmail.ts`: listMessages, getMessage, archiveMessage, addLabel
- `lib/outlook.ts`: funções equivalentes via MS Graph
- Função de classificação automática por remetente e assunto

**Passo 3.4 — Aba E-mails (4h)**
- Feed unificado: merge Gmail + Outlook ordenado por data
- Chips de conta no topo com contador de não lidos
- Painel lateral: corpo + ações (arquivar, criar task, snooze, abrir original)
- Ação "criar task": abre modal pré-preenchido

**Passo 3.5 — Aba Finanças + Porquinho IA (3h)**
- Cards de visão geral com cálculos sobre Financeiro do Notion
- Porquinho IA: campo de texto → `app/api/finance/parse/route.ts` → Claude API
- Prompt: "extraia Descrição, Valor, Tipo e Categoria desta frase"
- Confirmação antes de salvar no Notion
- Alertas de NF vencendo

---

### FASE 4 — Projetos + Clientes + Revisão Semanal (Semana 6 · ~8h)

**Passo 4.1 — Vercel Webhook (1h)**
- Criar `app/api/webhooks/vercel/route.ts`
- Validar header `x-vercel-signature` com o secret
- Salvar status do último deploy por projeto no Supabase (`deploy_status`)
- Configurar webhook na Vercel → endpoint de produção

**Passo 4.2 — Aba Projetos (2h)**
- Cards: nome, categoria, status, progresso, próxima ação, prazo, deploy status
- View Lista e View Kanban (3 colunas)
- Atualizar Próxima ação inline e Progresso % com slider

**Passo 4.3 — Aba Clientes (1h30)**
- Cards com badge de status, valor total, última interação
- Alerta visual se última interação > 7 dias

**Passo 4.4 — Revisão Semanal (2h)**
- Resumo automático: contar tarefas, calcular taxa de hábitos, somar receitas
- 3 campos de reflexão livre com autosave
- Campo de planejamento → cria tarefas no Notion
- Histórico de semanas anteriores

---

### FASE 5 — Polish + Deploy Produção (Semana 7 · ~5h)

- Revisar todos os estados vazios (zero dados, loading, erro de API)
- Adicionar toasts em todas as ações
- Testar fluxo completo: login → dash → criar tarefa → check-in → e-mail → logout
- Auditar console: zero warnings, zero erros não tratados
- Testar em mobile (PWA básico)
- Configurar n8n com as 4 automações de alta prioridade
- Documentar variáveis de ambiente em README.md (sem os valores)

---

## 9. Critérios de conclusão do MVP

- [ ] Dashboard carrega em menos de 3 segundos com dados reais do Notion
- [ ] Criar tarefa no LifeOS aparece imediatamente no Notion (e vice-versa)
- [ ] Check-in de hábito é salvo no banco Registros de Hábitos do Notion
- [ ] E-mails de pelo menos uma conta Gmail aparecem no feed unificado
- [ ] Porquinho IA interpreta "gastei 50 no almoço" e cria entrada no Financeiro
- [ ] Status de deploy do último projeto aparece no card de Deploys
- [ ] Alerta de cliente sem contato aparece quando última interação > 7 dias
- [ ] Revisão semanal gera resumo automático com dados reais da semana
- [ ] n8n envia lembrete matinal via Telegram todo dia útil às 07:30
- [ ] n8n cria task automaticamente quando deploy falha na Vercel
- [ ] Tela de login por magic link funciona sem erros
- [ ] App funciona em mobile (PWA) sem layout quebrado
- [ ] Zero credenciais expostas no lado do cliente ou no repositório
