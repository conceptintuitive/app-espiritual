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
| `lib/preco.js` | Fonte única do preço do Manual — `getPrecoManual(createdAt)` retorna R$27 nas primeiras 24h desde a análise, R$47 depois. Usada pelos dois checkouts, pela página de resultado, e-mails, Oráculo e `/explorar`. |
| `app/api/gerar-analise/route.js` | Recebe dados do formulário, computa signo + numero_vida, insere em `analises`. |
| `app/api/criar-checkout/route.js` | Cria sessão Stripe. Preço via `lib/preco.js` (R$27/R$47 por `created_at`). Previne double-pay. |
| `app/api/webhook/route.js` | Valida assinatura Stripe, atualiza DB, envia e-mail, dispara evento GA4 `purchase`. |
| `app/api/send/route.js` | Envia e-mail de acesso via Resend. |
| `app/page.js` | Landing page com formulário (55 KB); persiste estado no localStorage. |
| `app/resultado/[id]/page.js` | Prévia gratuita — estrutura de página de vendas em PT-BR. |
| `app/manual/[id]/page.js` | Manual completo; chama `generateManual()`, exporta PDF via html2canvas + jsPDF. |

### manualgenerator.js — como funciona

O arquivo contém grandes objetos de metadados (`SIGNO_PROFUNDO`, `NUMERO_PROFUNDO`, `REGENTE_PROFUNDO`, `ESTILO_ELEMENTO`, etc.) que mapeiam arquétipos espirituais. A função `generateManual(params)` recebe os dados do usuário e monta o manual combinando essas tabelas. `renderManualMarkdown(manual)` converte para markdown.

As seções geradas incluem: Perfil Energético, Missão de Alma, Desafios Kármicos, Potenciais Ocultos, Amor & Relacionamento, Dinheiro & Prosperidade, Plano de 7 Dias, Calendário Espiritual (4 semanas).

### Supabase — tabela `analises`

Colunas relevantes: `id` (UUID PK), `nome`, `email`, `data_nascimento`, `hora_nascimento`, `local_nascimento`, `objetivo_principal`, `relacao_status`, `trabalho_status`, `signo`, `numero_vida`, `status`, `payment_status` (`'pending'` | `'paid'`), `stripe_session_id`, `stripe_payment_intent`, `mp_payment_id`, `paid_at`, `valor_pago`, `origem` (`'venda'` | `'cortesia'` | `'teste'`), `updated_at`.

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
MP_ACCESS_TOKEN=
CRON_SECRET=
META_ACCESS_TOKEN=
TIKTOK_ACCESS_TOKEN=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_OAUTH_REDIRECT_URI=
TIKTOK_OAUTH_SCOPES=
TIKTOK_PUBLISH_API_SECRET=
TEST_EMAILS=
```

`SUPABASE_SERVICE_ROLE_KEY` é usada apenas em API routes (server-side). As variáveis `NEXT_PUBLIC_*` ficam expostas no cliente. `CRON_SECRET` protege `/api/cron/lembretes` e `/api/cron/tiktok-refresh` contra chamadas não autorizadas — o disparo é feito por um cron externo (ex: cron-job.org), já que o plano Vercel Hobby não permite cron com intervalo menor que 1x/dia.

Três integrações distintas com o TikTok, não confundir: `TIKTOK_ACCESS_TOKEN` é um token estático gerado manualmente no TikTok Ads Manager, usado só pela Events API (`lib/tiktok.js`, evento `CompletePayment` dos webhooks de pagamento). `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET` são do app cadastrado no TikTok for Developers, usados pelo fluxo OAuth do Login Kit (`lib/tiktokOAuth.js`, rotas `/api/tiktok/connect` e `/api/tiktok/callback`) — geram um access_token/refresh_token diferentes, guardados na tabela `tiktok_oauth_tokens`. `TIKTOK_OAUTH_REDIRECT_URI` e `TIKTOK_OAUTH_SCOPES` são opcionais (têm default no código; o escopo default inclui `video.upload`, exigido pelo Upload to inbox da Content Posting API). `TIKTOK_PUBLISH_API_SECRET` protege `/api/tiktok/publish` (`lib/tiktokContentPosting.js`) — rota chamada por automação externa (Make) pra enviar um vídeo já pronto (ex: gerado no Creatomate) pros **rascunhos** da conta TikTok conectada via OAuth (o TikTok notifica e a publicação é manual no app), usando o access_token/refresh_token da tabela acima. Não usa Direct Post (`video.publish`) de propósito: exige auditoria com tela de confirmação por post, incompatível com o fluxo automático.

## Important Conventions

- Path alias `@/*` aponta para a raiz do projeto (`jsconfig.json`).
- Todo o conteúdo visível ao usuário está em **português brasileiro**.
- `app/page.js` é um Client Component grande; evite adicionar lógica pesada — prefira mover para API routes ou `lib/`.
- O Stripe Checkout usa `promo_codes: true` — não remover.
- O webhook valida `stripe-signature` antes de processar; qualquer alteração deve manter essa validação.
- **Preço do Manual**: R$27 nas primeiras 24h desde `created_at` da análise, R$47 depois (sem tier de R$97). Regra única em `lib/preco.js` (`getPrecoManual`) — nunca hardcode 27/47 em outro lugar; importe de lá. Usada pelos checkouts (MP e Stripe), pela página de resultado (`precoAtual`), pelo Oráculo (prop `precoManual` do `ChatAssistente`), pelo e-mail de recuperação de +20h e pelo card do `/explorar` (via `/api/status-analise`, que devolve `precoAtual` já calculado).
- **`valor_pago` e `origem`**: `app/api/webhook-mp/route.js` e `app/api/webhook/route.js` gravam `valor_pago` (valor real cobrado na transação — `payment.transaction_amount` no MP, `session.amount_total / 100` no Stripe) em todo `.update()` que confirma pagamento (Manual, upsell de bônus avulso, Compatibilidade Completa). `valor_pago` reflete a transação mais recente confirmada, não um total acumulado. `origem` vem de `getOrigemVenda(email)` (`lib/testEmails.js`): `'venda'` por padrão, ou `'teste'` se o e-mail do pagador estiver na env `TEST_EMAILS` (lista separada por vírgula — compras de teste da própria autora, pra não sujar os números). Pagamento marcado como pago manualmente (fora de webhook, ex. `scripts/test-ia.mjs`) deve gravar `origem = 'cortesia'` e `paid_at`. Nunca marcar como pago sem esses dois campos. `scripts/backfill-origem-mp.mjs` resolve os registros antigos que a migração `0013_valor_pago_origem.sql` deixou com `origem` nulo (precisam consultar a API do MP) — roda em dry-run por padrão, `--apply` pra escrever. **Temporário**: `GET /api/admin/backfill-origem?secret=CRON_SECRET[&apply=1]` expõe essa mesma lógica como rota (criada pra rodar o backfill sem ambiente local) — remover depois do backfill único em produção.
- **Confirmação de pagamento MP pós-redirect**: `criar-checkout-mp` seta `notification_url` explícito (`/api/webhook-mp`) na preference, pra não depender só da config do painel do MP. `/manual/[id]` nunca mostra o paywall ("Desbloquear") pra quem chega com `?payment_id=...` do redirect do MP — mostra "Confirmando..." e chama `POST /api/confirmar-pagamento-mp` (consulta a API do MP direto e libera na hora se `approved`, sem esperar o webhook), com polling de 3s por até 2min como fallback; depois disso mostra timeout + botão "Verificar de novo". `lib/mpPagamentoManual.js` (`buildAtualizacaoPagamentoManual`) é a fonte única de como montar esse update — usada tanto pelo webhook quanto pela confirmação síncrona, pra nunca divergir sobre o que libera o Manual. Idempotente por design (os dois só regravam os mesmos campos); só o webhook dispara e-mail/IA/eventos de Purchase, nunca a confirmação síncrona (evita duplicar). `back_urls.failure` do checkout MP leva de volta pro `/resultado/[id]?pagamento=recusado`, que mostra um aviso sugerindo Pix.
