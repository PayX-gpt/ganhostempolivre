## Objetivo

Saber exatamente **onde cada lead clicou** em todo o funil (CTAs do quiz, botões dos upsells, "Não, obrigado", botões da oferta, etc.), gravando no `funnel_events` com o nome do botão, página, sessão e contexto.

## Como vai funcionar

### 1. Listener global de cliques (autocaptura)

Criar `src/lib/buttonTracker.ts` com um listener `document.addEventListener('click', ...)` registrado uma vez no `App.tsx`. Para todo clique em `<button>`, `<a>` ou elemento com `[data-track]`, ele grava no `funnel_events` um evento `button_click` contendo:

- `label` — texto visível do botão (truncado em 80 chars)
- `track_id` — valor do atributo `data-track` (quando definido) — ex.: `upsell1_buy`, `upsell1_decline`, `offer_main_cta`
- `route` — rota atual (`/step-5`, `/upsell1`, `/oferta`)
- `step` — slug do step quando dentro do quiz
- `position` — índice do botão na página (para diferenciar botões repetidos)
- `tag` — `button` ou `a`
- `href` — destino (se for link)
- UTMs + fbclid/ttclid já enriquecidos pelo `metricsClient`

Usa `saveFunnelEventReliable` (keepalive) para sobreviver a navegações.

### 2. Identificadores `data-track` nos botões críticos

Para nomes legíveis no painel (em vez de só "Continuar"), adicionar `data-track="..."` nos botões principais:

- Quiz: `quiz_step_{n}_next`, `quiz_step_{n}_option_{value}`
- Step 17 / Oferta: `offer_main_cta`, `offer_secondary_cta`, `offer_faq_open_{i}`
- Upsells 1/2/3: `upsell{n}_buy`, `upsell{n}_decline`, `upsell{n}_back`
- Página de obrigado: `thankyou_whatsapp`, `thankyou_access`

### 3. Deduplicação leve

Evitar duplicar o mesmo clique quando ele já dispara `checkout_click`/`step_completed`: se o botão tiver `data-track-skip-auto`, o listener ignora (esses já têm tracking próprio).

### 4. Painel `/live` — nova aba "Cliques do Lead"

Na timeline de cada sessão (`LiveLeadTimeline`), exibir os `button_click` em ordem cronológica com label e rota, dando visibilidade clara de cada ação.

## Detalhes técnicos

- Sem mudança de schema — `funnel_events` já aceita `event_data jsonb`.
- Listener usa `event.target.closest('button, a, [data-track]')` para capturar cliques em filhos (ícones, spans).
- Texto extraído via `element.innerText.trim().slice(0, 80)`; ignora cliques em elementos com `aria-hidden`.
- Throttle de 300ms por mesmo `track_id` para evitar duplo-clique inflar dados.
- Lista de rotas ignoradas: `/live`, `/dashboard`, `/admin` (não trackeia cliques internos do painel).

## Arquivos afetados

- **Novo:** `src/lib/buttonTracker.ts`
- **Edit:** `src/App.tsx` (registrar listener uma vez)
- **Edit:** componentes dos upsells (`Upsell1.tsx`, `Upsell2.tsx`, `Upsell3.tsx`) — adicionar `data-track`
- **Edit:** componente da oferta/step-17 — adicionar `data-track` nos CTAs
- **Edit:** `src/components/LiveLeadTimeline.tsx` — exibir `button_click` na timeline

## Validação após implementar

Abrir um upsell em preview, clicar em "Comprar" e "Não, obrigado", e confirmar via SQL:

```sql
SELECT created_at, event_data->>'track_id', event_data->>'label', event_data->>'route'
FROM funnel_events WHERE event_name = 'button_click'
ORDER BY created_at DESC LIMIT 20;
```
