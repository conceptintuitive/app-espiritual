# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intuitive Concept** — plataforma de análises espirituais personalizadas (numerologia, astrologia, arquétipos). O produto central é um manual premium gerado a partir de dados do usuário (nome, data de nascimento, objetivo, etc.), vendido via Stripe após uma prévia gratuita.

Stack: **Next.js 16 App Router** (JavaScript, sem TypeScript), **Supabase** (PostgreSQL), **Mercado Pago** (checkout principal — Pix/cartão) + **Stripe** (checkout secundário), **Resend** (e-mail), **Anthropic API** (geração do Manual) + **Groq API** (Oráculo), **Google Analytics 4**, **Meta CAPI** e **TikTok Events API** (eventos server-side).

## Development Commands

```bash
npm run dev      # Servidor de desenvolvimento (localhost:3000)
npm run build    # Build de produção
npm run lint     # ESLint (flat config nativa do eslint-config-next 16; 0 erros, avisos tolerados)
npm run start    # Servidor de produção
npm test         # node --test em tests/*.test.js (lib/sky.js, lib/fusoBR.js, lib/municipios.js, planetas/HD legado x fuso real) — sem dependências
node scripts/gerar-municipios.mjs  # regenera public/data/municipios-br.json (base IBGE)
```

## Architecture & Data Flow

### User Journey
```
/ (quiz em 4 etapas; etapa 4 dispara POST /api/lead-parcial no onBlur do e-mail)
  → POST /api/gerar-analise      (valida, calcula signo/números/planetas, geocoda a cidade via Nominatim,
                                  insere em `analises`; em after(): telefone, Lead Meta e 6 seções IA iniciais)
  → /resultado/[id]              (prévia gratuita + CTA)
  → POST /api/criar-checkout-mp  (preference Mercado Pago — CHECKOUT PRINCIPAL)
  → Mercado Pago (Pix/cartão)
  → POST /api/webhook-mp  e/ou  POST /api/confirmar-pagamento-mp (chamado por /manual/[id] no redirect)
        → lib/mpPagamentoManual.js (libera acesso, Purchase GA4/Meta/TikTok, e-mail de acesso 1x)
  → /manual/[id]                 (manual completo, protegido por payment_status;
                                  dispara POST /api/gerar-manual-completo se faltar seção IA)
```
Checkout **Stripe** (`/api/criar-checkout` → `/api/webhook`) ainda funciona, mas só é chamado pelo botão "Desbloquear" do paywall dentro de `/manual/[id]` (quem chega ao manual sem ter pago). Upsells (Previsão do Ano/tier2, Human Design, combo) usam `/api/criar-checkout-upsell-mp`; Compatibilidade Completa avulsa usa `/api/criar-checkout-compat-mp` (R$29,90) e é grátis via `/api/salvar-compat-pessoa2` para quem já comprou o Manual.

O item "Meu Mapa" do menu (`app/components/SiteNav.js`) aponta para `/resultado/[ultimaAnaliseId]` (lido de `localStorage.ic_ultima_analise_id`), **não** para `/manual/[id]`.

### Key Files

| File | Role |
|---|---|
| `lib/manualgenerator.js` | **Esqueleto do manual** — `generateManual(params)` monta as seções a partir de tabelas estáticas de numerologia/astrologia; os campos `*_gerado` (IA) salvos na análise substituem o texto estático de cada seção quando existem. |
| `lib/calculos.js` | Números (`calcularNumeroVida`, `calcularNumeroAlma`, `calcularNumeroExpressao`, `calcularAnoPessoal`, `calcularMesPessoal`), signo, posições planetárias (`calcularPlanetas`, Meeus/Schlyter), `calcularAscendente`, corpos para Human Design. |
| `lib/ia.js` | **Conectada ao fluxo.** Todas as seções do Manual (`gerar*IA`) usam `chamarClaude()` → Anthropic API, modelo `claude-sonnet-4-6` (`ANTHROPIC_API_KEY`). `_callGroq`, `MODEL_HEAVY`/`MODEL_LIGHT` e `gerarAnaliseEspiritual` (Groq) estão sem uso. Chamada por `gerar-analise` (6 seções iniciais) e `gerar-manual-completo` (restante). |
| `lib/assistente.js` | Oráculo/chat (`/api/assistente`, `app/components/ChatAssistente.js`) — Groq, modelo `openai/gpt-oss-120b` (`GROQ_API_KEY`). |
| `lib/supabaseBrowser.js` | Cliente Supabase para o browser. |
| `lib/preco.js` | Fonte única do preço do Manual — `getPrecoManual(createdAt)` retorna R$27 nas primeiras 24h desde a análise, R$47 depois. Também exporta `PRECO_BONUS_AVULSO`/`PRECO_BONUS_COMBO`. Usada pelos dois checkouts, pela página de resultado, e-mails, Oráculo e `/explorar`. |
| `lib/mpPagamentoManual.js` | Pós-pagamento MP do Manual (ver convenções). |
| `app/api/gerar-analise/route.js` | Recebe dados do quiz, calcula signo/números/planetas, geocoda a cidade (Nominatim) para lat/long + Ascendente, insere em `analises`, gera 6 seções IA em `after()`. `calcularNumeroVida` vem de `lib/calculos.js`; ainda tem uma cópia local de `calcularSigno(dataISO)` (assinatura diferente da lib). |
| `app/api/gerar-manual-completo/route.js` | Gera as seções IA que faltam (`maxDuration = 300`); chamada por `/manual/[id]` quando `payment_status='paid'` e `fechamento_gerado` é null. |
| `app/api/criar-checkout-mp/route.js` | **Checkout principal** — preference MP do Manual (+ combo opcional), preço via `lib/preco.js`, `notification_url` explícito, valida e-mail antes de chamar o MP. |
| `app/api/webhook-mp/route.js` | Webhook MP (Manual, upsells, Compatibilidade Completa). |
| `app/api/criar-checkout/route.js` | Checkout Stripe (secundário, só no paywall de `/manual/[id]`). Preço via `lib/preco.js`. Previne double-pay. `allow_promotion_codes: true`. |
| `app/api/webhook/route.js` | Valida assinatura Stripe, atualiza DB, dispara Purchase GA4/Meta/TikTok, chama `/api/send`. |
| `app/api/send/route.js` | Envia e-mail de acesso via Resend. Chamado em `${getBaseUrl()}/api/send` (`lib/baseUrl.js`: `NEXT_PUBLIC_BASE_URL` → `VERCEL_URL` → localhost) pelo webhook Stripe e por `lib/mpPagamentoManual.js`. Em produção `NEXT_PUBLIC_BASE_URL` precisa ser o domínio oficial; num preview com proteção de deploy da Vercel a chamada pro próprio preview leva 401 (o e-mail não sai no preview, de propósito). |
| `app/api/cron/lembretes/route.js` | E-mails de recuperação/nutrição (agrupa por e-mail, rodapé de descadastro via `/api/unsubscribe`). |
| `app/page.js` | Landing + quiz em 4 etapas (Client Component, ~47 KB). Não persiste o estado do quiz por conta própria; lê `ic_ultima_analise_id` e `ic_ceu_dados` (pré-preenchimento vindo do `/ceu`, ver Olho Cósmico). Query string: só `?refazer=1`. |
| `app/components/olho/` | **Olho Cósmico** — `OlhoCosmico.js` (abertura animada por scroll, portada da demo `reference/olho-cosmico/` que vive só na branch `reference-olho`, fora da main), `OlhoCosmico.module.css`, `OlhoCosmicoManual.js` (monta os dados a partir do registro). Ver convenções. |
| `app/ceu/` | Rota pública `/ceu` — Olho Cósmico com perguntas (`mode="publico"`). |
| `app/components/CidadeAutocomplete.js` | Autocomplete de município (quiz etapa 3 e `/ceu`). Texto livre continua valendo. |
| `lib/sky.js` | Matemática do céu: `localToUTC` (fuso IANA histórico via Intl), `localSiderealDeg`, `altAz`, `sunRaDec`, `makeProjector` (estereográfica no zênite), `birthSky`. Testes em `tests/sky.test.js`. |
| `lib/fusoPorCoordenada.js` | **Só servidor**: fuso IANA do município mais próximo de uma lat/long (importa a base inteira). Usado por `gerar-analise` no Ascendente de quem digitou a cidade em texto livre. |
| `lib/fusoBR.js` | Fuso IANA por município: tabela por UF + exceções (Noronha, oeste do AM → Eirunepe, oeste do PA → Santarem por longitude). `FUSOS_BR` = whitelist. |
| `lib/municipios.js` | Carrega `public/data/municipios-br.json` sob demanda (~83 KB gzip) e busca/resolve municípios (sem acento, "Cidade, UF", mais próximo por lat/long). |
| `lib/ceuDados.js` | Repasse `/ceu` → quiz via localStorage `ic_ceu_dados` (validade 24h, flag `abrirQuiz` consumido uma vez). Nunca por query string. |
| `app/resultado/[id]/page.js` | Prévia gratuita — página de vendas em PT-BR, chama `criar-checkout-mp`. |
| `app/manual/[id]/page.js` | Manual completo; chama `generateManual()` com `pendingFields`, confirma pagamento MP pós-redirect, dispara `gerar-manual-completo`. **Não exporta PDF** (`jspdf` está no package.json sem uso); `html2canvas` só é usado em `app/components/SeloArquetipo.js` para exportar o selo como imagem. |
| `app/api/card/route.js`, `app/api/og/[id]/route.js` | Card 1080x1920 de story (fontes em `app/api/card/fonts`) e imagem OG de fallback. |

### manualgenerator.js — como funciona

O arquivo contém grandes objetos de metadados (`SIGNO_PROFUNDO`, `NUMERO_PROFUNDO`, `REGENTE_PROFUNDO`, `ESTILO_ELEMENTO`, etc.) que mapeiam arquétipos espirituais. A função `generateManual(params)` recebe os dados do usuário e monta o manual combinando essas tabelas. `renderManualMarkdown(manual)` converte para markdown.

As seções com versão IA são as listadas em `app/api/gerar-manual-completo/route.js` (síntese, diagnóstico, tipo de pessoa, amor, arquétipos, ponto cego, bloqueios, dinheiro, rituais, objetivo, leitura integrada, plano de 7 dias, calendário de 4 semanas, fechamento). Essa é a fonte da verdade da lista.

### Supabase — tabela `analises`

Colunas relevantes:
- **Dados do quiz:** `id` (UUID PK), `created_at`, `nome`, `email`, `telefone`, `data_nascimento` (`YYYY-MM-DD`), `hora_nascimento` (`HH:MM` ou null se "não sei"), `local_nascimento` (texto livre), `latitude`/`longitude` (geocoding Nominatim, podem ser null), `objetivo_principal`, `relacao_status`, `trabalho_status`.
- **Calculados:** `signo`, `numero_vida`, `ano_pessoal`, `numero_alma`, `numero_expressao`, `signo_lua`, `signo_venus`, `signo_marte`, `signo_mercurio`, `signo_nodo`, `signo_ascendente`, `lua_cuspide`, `carta_tarot`, `imagem_ia_url`.
- **IA:** `preview_gerado`, `carta_tarot_interpretacao` e as colunas `*_gerado` de `gerar-manual-completo`.
- **Pagamento:** `status`, `payment_status` (`'pending'` | `'paid'`), `stripe_session_id`, `stripe_payment_intent`, `mp_payment_id`, `paid_at`, `valor_pago`, `origem` (`'venda'` | `'cortesia'` | `'teste'`), `processado_em`, `updated_at`; upsells com prefixos `tier2_*`, `hd_*`, `compat_*`.
- **E-mail/marketing:** `reminder_1h_sent_at`, `reminder_24h_sent_at`, `unsubscribed`, `lead_ultima_semana_email`, `tier2_ultimo_email_mes`, `presente_de`, `presente_email`.

Offset do nascimento (migração `0016_utc_offset_nascimento.sql`): `utc_offset_nascimento` (numeric, horas, ex. `-2`) — só em análises novas com hora; null em todo o resto (ver convenção "Fuso horário de nascimento"). Gravado em update separado best effort.

Local de nascimento (migração `0015_municipio_fuso.sql`, opcionais): `municipio_ibge`, `fuso_iana` — preenchidas só quando a cidade foi escolhida no autocomplete; gravadas por `gerar-analise` num update separado best effort (mesmo padrão do `telefone`), então o insert nunca falha se a migração não tiver rodado.

Outras tabelas (ver `supabase/migrations/`): `chat_mensagens`, `leads_parciais`, `tiktok_oauth_tokens`, `tiktok_publishes`, `manual_feedback`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
NEXT_PUBLIC_BASE_URL=
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

`ANTHROPIC_API_KEY` gera o Manual (`lib/ia.js`); `GROQ_API_KEY` é só do Oráculo (`lib/assistente.js`). `NEXT_PUBLIC_BASE_URL` é a URL base usada nos checkouts e no cron (fallback: `VERCEL_URL`, depois `localhost:3000`) — não existe `NEXT_PUBLIC_SITE_URL` no código. `SUPABASE_SERVICE_ROLE_KEY` é usada apenas em API routes (server-side). As variáveis `NEXT_PUBLIC_*` ficam expostas no cliente. `CRON_SECRET` protege `/api/cron/lembretes` e `/api/cron/tiktok-refresh` contra chamadas não autorizadas — o disparo é feito por um cron externo (ex: cron-job.org), já que o plano Vercel Hobby não permite cron com intervalo menor que 1x/dia.

Três integrações distintas com o TikTok, não confundir: `TIKTOK_ACCESS_TOKEN` é um token estático gerado manualmente no TikTok Ads Manager, usado só pela Events API (`lib/tiktok.js`, evento `CompletePayment` dos webhooks de pagamento). `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET` são do app cadastrado no TikTok for Developers, usados pelo fluxo OAuth do Login Kit (`lib/tiktokOAuth.js`, rotas `/api/tiktok/connect` e `/api/tiktok/callback`) — geram um access_token/refresh_token diferentes, guardados na tabela `tiktok_oauth_tokens`. `TIKTOK_OAUTH_REDIRECT_URI` e `TIKTOK_OAUTH_SCOPES` são opcionais (têm default no código; o escopo default inclui `video.upload`, exigido pelo Upload to inbox da Content Posting API). `TIKTOK_PUBLISH_API_SECRET` protege `/api/tiktok/publish` (`lib/tiktokContentPosting.js`) — rota chamada por automação externa (Make) pra enviar um vídeo já pronto (ex: gerado no Creatomate) pros **rascunhos** da conta TikTok conectada via OAuth (o TikTok notifica e a publicação é manual no app), usando o access_token/refresh_token da tabela acima. Não usa Direct Post (`video.publish`) de propósito: exige auditoria com tela de confirmação por post, incompatível com o fluxo automático.

## Important Conventions

- Path alias `@/*` aponta para a raiz do projeto (`jsconfig.json`).
- Todo o conteúdo visível ao usuário está em **português brasileiro**.
- `app/page.js` é um Client Component grande; evite adicionar lógica pesada — prefira mover para API routes ou `lib/`.
- O Stripe Checkout usa `allow_promotion_codes: true` — não remover.
- **Fuso horário de nascimento**: `gerar-analise` calcula UMA vez o offset real da época e do lugar — `utcOffsetHoras({ data, hora, tz })` de `lib/sky.js`, com `tz` = município do autocomplete → `fusoPorCoordenada(lat, lon)` (texto livre) → `America/Sao_Paulo` (sem cidade) — e usa em tudo: planetas (`calcularPlanetas(data, hora, utcOffset)`), Ascendente, e grava em `utc_offset_nascimento` (migração 0016). Human Design (`calcularHumanDesign(..., offsetSalvo(row) ?? -3)`) e Compatibilidade Completa (`calcularSignosPessoa(..., offsetSalvo(row))`) são **recalculados a cada visita** e leem esse valor salvo. **Registros antigos não mudam, de propósito (sem backfill)**: `utc_offset_nascimento` fica null neles e tudo cai no cálculo legado — planetas tratam a hora local como UTC (sem conversão), Human Design usa `-3`, e o `signo_ascendente` salvo veio da heurística antiga (`-2` de nov a fev, `-3` no resto). Nunca mude o default legado dessas funções nem preencha `utc_offset_nascimento` em registros antigos: mudaria o que a pessoa já comprou. Páginas que fazem `select` com colunas explícitas (`/human-design/[id]`, `/compatibilidade-completa/[id]`) buscam o offset numa consulta separada (`buscarOffsetNascimento`), pra não quebrar se a coluna faltar.
- **Olho Cósmico**: o componente `app/components/olho/OlhoCosmico.js` só entra via `next/dynamic` com `ssr:false` (`app/ceu/CeuClient.js` e `/manual/[id]`) — **nunca** importe estaticamente nem coloque na landing/quiz. No `/manual/[id]` aparece só com `hasPaid && !gerando`, acima do `#manual` (a barra de progresso de leitura conta a partir do `#manual`), com botão "pular ↓" durante toda a animação; quando a pessoa pula ou chega ao número grava `ic_olho_visto_<id>` no localStorage e, nas visitas seguintes, o Manual abre direto no conteúdo com "✦ rever minha abertura" no topo. No `/ceu`, "Nasci fora do Brasil" (link abaixo da cidade) pula o céu real e vai direto pros dígitos/número com a legenda "O céu do seu nascimento ainda não está disponível para fora do Brasil." (céu internacional é pendência futura). Hora desconhecida = 21h, legenda "céu aproximado", nunca modo dia. Modo dia (Sol acima de ~-3°): a imagem `e4` some e o canvas desenha no zênite uma estrela menor e branca. `prefers-reduced-motion`: uma tela estática, sem scroll. O palco usa "sticky" em JS (fixed/absolute), porque `position: sticky` quebra com o `overflow-x: hidden` do body do Manual. Número: `numero_vida` do registro no modo manual, `calcularNumeroVida` de `lib/calculos.js` no `/ceu` — nunca a função da demo. Assets em `public/olho/` (WebP, fontes self-hosted, `sky.json` d3-celestial BSD-3 com a licença ao lado).
- **Local de nascimento**: com município escolhido no autocomplete, o quiz manda `municipio_ibge`/`latitude`/`longitude`/`fuso_iana`; `gerar-analise` valida (`municipioDoBody`: IBGE, caixa do Brasil, fuso na whitelist) e pula o Nominatim. Texto livre segue o caminho antigo (geocoding). O fuso entra no Ascendente (ver "Fuso horário de nascimento").
- **Código morto conhecido**: `_callGroq`/`gerarAnaliseEspiritual` em `lib/ia.js`, dependência `jspdf`/`jspdf-autotable`.
- O webhook valida `stripe-signature` antes de processar; qualquer alteração deve manter essa validação.
- **Preço do Manual**: R$27 nas primeiras 24h desde `created_at` da análise, R$47 depois (sem tier de R$97). Regra única em `lib/preco.js` (`getPrecoManual`) — nunca hardcode 27/47 em outro lugar; importe de lá. Usada pelos checkouts (MP e Stripe), pela página de resultado (`precoAtual`), pelo Oráculo (prop `precoManual` do `ChatAssistente`), pelo e-mail de recuperação de +20h e pelo card do `/explorar` (via `/api/status-analise`, que devolve `precoAtual` já calculado).
- **`valor_pago` e `origem`**: `app/api/webhook-mp/route.js` e `app/api/webhook/route.js` gravam `valor_pago` (valor real cobrado na transação — `payment.transaction_amount` no MP, `session.amount_total / 100` no Stripe) em todo `.update()` que confirma pagamento (Manual, upsell de bônus avulso, Compatibilidade Completa). `valor_pago` reflete a transação mais recente confirmada, não um total acumulado. `origem` vem de `getOrigemVenda(email)` (`lib/testEmails.js`): `'venda'` por padrão, ou `'teste'` se o e-mail do pagador estiver na env `TEST_EMAILS` (lista separada por vírgula — compras de teste da própria autora, pra não sujar os números). Pagamento marcado como pago manualmente (fora de webhook, ex. `scripts/test-ia.mjs`) deve gravar `origem = 'cortesia'` e `paid_at`. Nunca marcar como pago sem esses dois campos. `scripts/backfill-origem-mp.mjs` resolve os registros antigos que a migração `0013_valor_pago_origem.sql` deixou com `origem` nulo (precisam consultar a API do MP) — roda em dry-run por padrão, `--apply` pra escrever. **Temporário**: `GET /api/admin/backfill-origem?secret=CRON_SECRET[&apply=1]` expõe essa mesma lógica como rota (criada pra rodar o backfill sem ambiente local) — remover depois do backfill único em produção.
- **Confirmação de pagamento MP pós-redirect**: `criar-checkout-mp` seta `notification_url` explícito (`/api/webhook-mp`) na preference, pra não depender só da config do painel do MP. `/manual/[id]` nunca mostra o paywall ("Desbloquear") pra quem chega com `?payment_id=...` do redirect do MP — mostra "Confirmando..." e chama `POST /api/confirmar-pagamento-mp` (consulta a API do MP direto e libera na hora se `approved`, sem esperar o webhook), com polling de 3s por até 2min como fallback; depois disso mostra timeout + botão "Verificar de novo" + contato de suporte (conceptintuitive@gmail.com). `back_urls.failure` do checkout MP leva de volta pro `/resultado/[id]?pagamento=recusado`, que mostra um aviso sugerindo Pix.
- **`lib/mpPagamentoManual.js`**: fonte única de tudo que acontece depois de um pagamento MP aprovado do Manual — usada tanto pelo webhook quanto por `/api/confirmar-pagamento-mp`, pra nunca divergirem. `liberarAcessoManual()` grava `payment_status`/combo tier2-hd/`valor_pago`/`origem` (idempotente — os dois caminhos podem rodar, regravam os mesmos valores). `dispararPosPagamentoManual()` cuida do pós-liberação: Purchase (GA4/Meta/TikTok) dispara **dos dois caminhos sempre**, usando `mp_payment_id` como `transactionId`/`event_id` nos dois — a deduplicação é do lado do Meta/GA4/TikTok, não precisa de lock aqui; o e-mail de acesso dispara **uma vez só**, via lock atômico na coluna `processado_em` (`UPDATE ... WHERE processado_em IS NULL` — só quem gravar primeiro manda o e-mail). Geração de conteúdo IA **não** é duplicada aqui de propósito: já tem fallback garantido em `app/api/gerar-manual-completo/route.js`, chamado automaticamente por `/manual/[id]` assim que `payment_status` vira `'paid'` (que os dois caminhos acima já causam).
- **Seções do Manual "Preparando..." durante a geração IA**: enquanto `payment_status='paid'` e `fechamento_gerado` ainda é null (mesma condição que dispara a geração sob demanda em `/manual/[id]`), cada seção cujo campo `_gerado` específico ainda está null mostra um placeholder "Preparando essa parte do seu Manual…" em vez do texto estático genérico. Implementado em `lib/manualgenerator.js` via `generateManual({ ...params, pendingFields: Set<string> })` — `pendingFields` é opcional (outros call sites como `app/api/card/route.js` não passam, comportamento idêntico a antes). A lista de colunas IA está duplicada como `CAMPOS_GERADOS_IA` em `app/manual/[id]/page.js` (mesma de `gerar-manual-completo/route.js`, exceto `sintese_gerada`, que não vira seção própria) — se adicionar/remover uma seção IA, atualizar as duas listas.
- **Validação de e-mail**: `lib/emailValidacao.js` é a fonte única — `emailValido(email)` (regex, mesmo padrão usado pra `presenteEmail`/`lead-parcial`) e `sugestaoEmail(email)` (corrige domínios digitados errado comuns: `gmail.con`, `gmial.com`, `hotmail.con`, `outlook.con`, estilo "Você quis dizer...?"). Usada no quiz (`app/page.js`, erro inline + sugestão clicável), em `gerar-analise` (rejeita no cadastro) e em `criar-checkout-mp` (não chama a API do MP se o e-mail salvo na análise for inválido — devolve `{error:'email_invalido', mensagem, emailAtual}` sem criar a preference; o front em `/resultado/[id]` mostra um modal pra corrigir e reenviar com `emailCorrigido` no mesmo POST, sem refazer o quiz).
