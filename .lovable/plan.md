

# Auditoria Completa do Quiz — Diagnóstico da Queda

## Dados Analisados (10 dias)

```text
Data       | Visitantes | Vendas | Conv% | Step1→Step2
-----------+------------+--------+-------+------------
12/mar     |   6.206    |  287   | 4.62% |   69.0%
13/mar     |   4.885    |  260   | 5.32% |   63.0%
14/mar     |   3.710    |  159   | 4.29% |   63.1%
15/mar     |   2.515    |   90   | 3.58% |   58.5%
16/mar     |   1.171    |   57   | 4.87% |   59.4%
17/mar     |   3.129    |  114   | 3.64% |   65.5%
18/mar     |   1.698    |   49   | 2.89% |   67.2%
19/mar     |   1.169    |   33   | 2.82% |   59.6%
20/mar*    |     361    |   10   | 2.77% |   43.4%*
```
*Dia 20 ainda em andamento.

---

## Diagnóstico — 3 Problemas Encontrados

### 1. Queda de tráfego (problema externo — anúncios)
- O volume caiu de **6.206** sessões (12/mar) para **1.169** (19/mar) — queda de **81%**.
- A distribuição A/B está uniforme (25% cada), então o problema não é no teste A/B.
- Isso é causado por **redução de investimento ou fatiga dos anúncios**, não pelo quiz.

### 2. Queda na taxa de conversão (problema potencial — página /oferta)
- A conversão caiu de **~5%** (12-13/mar) para **~2.8%** (18-19/mar).
- O funil interno (step-1 a step-17) está funcionando normalmente — a retenção step-1→step-2 está estável em 60-67%.
- A queda coincide com a introdução dos **4 planos na página /oferta** (R$37, R$47, R$97, R$197). Antes havia apenas um preço de R$47.
- **Hipótese: paralisia de decisão** — oferecer 4 opções no momento de compra pode estar confundindo o lead e reduzindo a conversão.

### 3. Bounce alto no Step 1 (alerta)
- Em 17/mar: **1.074 sessões** (34%) viram apenas o step-1 e não avançaram para o step-2.
- Em 19/mar: **456 sessões** (39%) fizeram o mesmo.
- Isso indica que a **qualidade do tráfego piorou** — pessoas clicam no anúncio mas não engajam com o quiz.

---

## O que NÃO está quebrado (código OK)

- Rastreamento de eventos está funcionando normalmente
- Pixels Meta (4 pixels) e TikTok estão disparando PageView corretamente
- UTM capture está intacto
- Webhook da Kirvano está registrando vendas corretamente
- Sessão e atribuição funcionando (sem vendas órfãs significativas)
- Redirecionamento de steps funciona
- A/B test distribuindo igualmente

---

## Plano de Ação Recomendado

### Ação 1 — Simplificar página /oferta (alto impacto)
Voltar para uma versão mais simples com destaque forte no plano de R$47 (Essencial), com os outros planos menos visíveis ou em um accordion "Ver outros planos". Reduzir a paralisia de decisão.

### Ação 2 — Criar alerta no /live para monitorar bounce rate do Step 1
Adicionar um KPI "Taxa de Bounce Step 1" no dashboard para detectar quando a qualidade do tráfego cai.

### Ação 3 — Nenhuma mudança no código do quiz
O quiz em si está funcionando bem. A retenção entre steps está estável. O problema está na **entrada** (tráfego) e na **saída** (página de oferta com muitos planos).

---

## Resumo

| Problema | Causa | Solução |
|----------|-------|---------|
| Menos visitantes | Anúncios/investimento | Revisar campanhas Meta/TikTok |
| Conv% caiu de 5% → 2.8% | Página /oferta com 4 planos | Simplificar oferta, destacar R$47 |
| Bounce alto no Step 1 | Qualidade do tráfego | Revisar criativos e segmentação |

Devo implementar a simplificação da página /oferta para priorizar o plano Essencial (R$47)?

