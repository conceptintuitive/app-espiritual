# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intuitive Concept** — plataforma de análises espirituais personalizadas (numerologia, astrologia, arquétipos). O produto central é um manual premium gerado a partir de dados do usuário (nome, data de nascimento, objetivo, etc.), vendido via Stripe após uma prévia gratuita.

Stack: **Next.js 16 App Router**, **Supabase** (PostgreSQL + auth), **Stripe** (pagamentos), **Resend** (e-mail), **Groq API** (IA), **Google Analytics 4**.

## Development Commands

```bash
npm run dev      # Servidor de desenvolvimento (localhost:3000)
npm run build    # Build de produção
npm run lint     # ESLint
npm run start    # Servidor de produção
```

## Architecture & Data Flow

### User Journey
```
/ (formulário)
  → POST /api/gerar-analise   (valida, calcula signo/número de vida, salva na tabela `analises`)
  → /resultado/[id]           (prévia gratuita + CTA de upgrade)
  → POST /api/criar-checkout  (cria sessão Stripe Checkout)
  → Stripe Checkout
  → POST /api/webhook         (evento checkout.session.completed → payment_status='paid', dispara e-mail)
  → /manual/[id]              (manual completo, protegido por payment_status)
```

### Key Files

| File | Role |
|---|---|
| `lib/manualgenerator.js` | **Motor principal** — gera o manual completo a partir dos dados do usuário usando tabelas estáticas de numerologia/astrologia. Não usa IA por padrão. |
| `lib/calculos.js` | Cálculo do número de vida (redução numerológica) e signo zodiacal. |
| `lib/ia.js` | Integração Groq API (llama-3.3-70b). Existe, mas **não está conectada ao fluxo principal** ainda. |
| `lib/supabaseBrowser.js` | Cliente Supabase para o browser. |
| `app/api/gerar-analise/route.js` | Recebe dados do formulário, computa signo + numero_vida, insere em `analises`. |
| `app/api/criar-checkout/route.js` | Cria sessão Stripe (R$ 47). Previne double-pay. |
| `app/api/webhook/route.js` | Valida assinatura Stripe, atualiza DB, envia e-mail, dispara evento GA4 `purchase`. |
| `app/api/send/route.js` | Envia e-mail de acesso via Resend. |
| `app/page.js` | Landing page com formulário (55 KB); persiste estado no localStorage. |
| `app/resultado/[id]/page.js` | Prévia gratuita — estrutura de página de vendas em PT-BR. |
| `app/manual/[id]/page.js` | Manual completo; chama `generateManual()`, exporta PDF via html2canvas + jsPDF. |

### manualgenerator.js — como funciona

O arquivo contém grandes objetos de metadados (`SIGNO_PROFUNDO`, `NUMERO_PROFUNDO`, `REGENTE_PROFUNDO`, `ESTILO_ELEMENTO`, etc.) que mapeiam arquétipos espirituais. A função `generateManual(params)` recebe os dados do usuário e monta o manual combinando essas tabelas. `renderManualMarkdown(manual)` converte para markdown.

As seções geradas incluem: Perfil Energético, Missão de Alma, Desafios Kármicos, Potenciais Ocultos, Amor & Relacionamento, Dinheiro & Prosperidade, Plano de 7 Dias, Calendário Espiritual (30 dias).

### Supabase — tabela `analises`

Colunas relevantes: `id` (UUID PK), `nome`, `email`, `data_nascimento`, `hora_nascimento`, `local_nascimento`, `objetivo_principal`, `relacao_status`, `trabalho_status`, `signo`, `numero_vida`, `status`, `payment_status` (`'pending'` | `'paid'`), `stripe_session_id`, `stripe_payment_intent`, `paid_at`, `updated_at`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
GROQ_API_KEY=
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
NEXT_PUBLIC_SITE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` é usada apenas em API routes (server-side). As variáveis `NEXT_PUBLIC_*` ficam expostas no cliente.

## Important Conventions

- Path alias `@/*` aponta para a raiz do projeto (`jsconfig.json`).
- Todo o conteúdo visível ao usuário está em **português brasileiro**.
- `app/page.js` é um Client Component grande; evite adicionar lógica pesada — prefira mover para API routes ou `lib/`.
- O Stripe Checkout usa `promo_codes: true` — não remover.
- O webhook valida `stripe-signature` antes de processar; qualquer alteração deve manter essa validação.
