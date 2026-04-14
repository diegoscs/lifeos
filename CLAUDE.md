# LifeOS — Instruções para o Claude Code

## O que é este projeto
Sistema operacional pessoal em Next.js 15. Backend único: Notion API. Auth: Supabase magic link. Custo: R$0/mês no MVP.

## Leia antes de qualquer coisa
O arquivo `ESCOPO_TECNICO.md` nesta pasta contém toda a especificação técnica. Consulte-o antes de responder sobre arquitetura, estrutura de pastas, bancos de dados ou decisões técnicas.

## Quem sou eu
- Diego, dev full-stack solo, São Paulo
- Stack principal: Next.js, TypeScript, Tailwind, Supabase, Python
- Repositório: `lifeos` no GitHub (privado)

## Regras absolutas
- Notion é o backend único — não criar tabelas no Supabase para dados de negócio
- Supabase apenas para Auth (magic link, single-user)
- Custo zero no MVP — não sugerir serviços pagos
- Single-user first — não implementar multi-tenancy
- Nunca expor credenciais no lado do cliente
- Todas as chamadas a APIs externas via API Routes (server-side), nunca no browser

## Padrões de código
- TypeScript strict mode — zero `any` implícito
- Server Components por padrão — Client Components só com `useState`, `useEffect` ou event handlers
- Marcar client components com `"use client"` na primeira linha
- Commits em inglês: `feat: add task toggle`, `fix: notion api timeout`
- Branches: `feat/nome-da-feature` ou `fix/nome-do-bug`

## Convenções de nomenclatura
- Componentes: `PascalCase` — `TaskItem`, `HabitRow`, `EmailFeed`
- Hooks: `camelCase` com prefixo `use` — `useTasks`, `useHabits`
- Tipos: interfaces `PascalCase` em `types/index.ts`
- Variáveis e funções: `camelCase`

## IDs dos bancos Notion (já criados)
```
NOTION_TASKS_DB=3425a8d1-caf6-8142-8213-c84b900c906a
NOTION_PROJECTS_DB=3425a8d1-caf6-8121-ab4d-f407d5bddfec
NOTION_HABITS_DB=3425a8d1-caf6-81af-bd8f-e57181c45047
NOTION_RECORDS_DB=3425a8d1-caf6-817e-ae8b-df2763eb3a5a
NOTION_FINANCE_DB=3425a8d1-caf6-81ab-ae60-cd7b380b16a7
NOTION_CLIENTS_DB=3425a8d1-caf6-814b-b843-eb57c3310fc5
```

## Como trabalhar comigo
Diga sempre em qual fase e passo estamos. Ex:
- "Fase 1, Passo 1.2 — configurar Supabase Auth"
- "Fase 2, Passo 2.3 — componente TaskItem"

Prefiro:
- Código completo e pronto para usar — sem trechos incompletos
- Caminho do arquivo no topo de cada bloco de código
- Explicação breve do que foi feito + próximo passo
