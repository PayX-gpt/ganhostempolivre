

# Plan: Corrigir Métricas do Dashboard — Auditoria Completa

## Problemas Identificados

### 1. "Leads Qualificados" totalmente errado
**Valor atual**: 8 (usa `intent_score >= 50` da tabela `lead_behavior`)  
**Valor real**: Deveria ser ~746 (leads que informaram contato via `lead_captured`) ou ~813 (quiz completo)  
**Causa**: O campo `intent_score` raramente passa de 50 — 66 leads têm score 1-29, apenas 8 têm 50+. A definição de "qualificado" está errada.  
**Correção**: "Leads qualificados" = sessões que completaram o quiz (chegaram no step-15/16/17). Isso é o real indicador de qualificação no funil.

### 2. "Vendas Hoje" conta statuses errados
**Valor atual**: Conta `approved` + `completed` + `purchased` + `redirected` como vendas aprovadas (linha 230-231)  
**Valor real**: Deveria contar apenas `approved` (é o que o webhook Kirvano define como venda real confirmada)  
**Impacto**: O KPI "Vendas Hoje" fica inflado comparado ao A/B test que usa apenas `approved`  
**Dados**: 225 approved hoje. Os statuses `completed`/`purchased`/`redirected` são estados intermediários, não vendas confirmadas.

### 3. Timezone inconsistente no Live.tsx
**Problema**: `todayISO` usa `new Date().setHours(0,0,0,0).toISOString()` — isso usa o timezone do browser do usuário, não São Paulo.  
**Impacto**: Se o user acessar de outro fuso, os dados do "hoje" ficam errados. O A/B test usa SP corretamente, criando discrepância.  
**Correção**: Usar mesma lógica de São Paulo do A/B test.

### 4. Query de lead_captured pode perder dados (limite 1000 rows)
**Problema**: Linha 255 `supabase.from("funnel_events").select("session_id").eq("event_name", "lead_captured")` não pagina.  
**Dados**: 752 registros hoje — próximo do limite de 1000. Em dias de tráfego alto, dados serão truncados silenciosamente.

### 5. Separação Front vs Total não está clara nos KPIs
**Problema**: "Vendas Hoje" mostra TODAS as vendas (front + upsell), mas o subtitle mostra apenas reembolsos. Deveria separar visualmente front e upsell para bater com o A/B test.

## Correções Planejadas

### Fix 1: Live.tsx — Corrigir "Leads Qualificados"
Mudar de `intent_score >= 50` para contar sessões que completaram o quiz (step_viewed com step-15/16/17). Com paginação para evitar limite de 1000.

### Fix 2: Live.tsx — Alinhar status de vendas
Contar apenas `status = 'approved'` como venda confirmada (remover `completed`, `purchased`, `redirected`).

### Fix 3: Live.tsx — Timezone São Paulo consistente
Substituir `new Date().setHours(0,0,0,0).toISOString()` por cálculo baseado em `America/Sao_Paulo`, mesma lógica do A/B test.

### Fix 4: Live.tsx — Paginar queries de leads
Adicionar paginação nas queries de `lead_captured` e `lead_behavior` para evitar truncamento.

### Fix 5: Live.tsx — KPI subtitle mais informativo
Mostrar "X front + Y upsell" no subtitle de vendas, e "X completaram quiz" no subtitle de leads.

## Arquivos a Editar

1. **`src/pages/Live.tsx`** — Todas as 5 correções acima (timezone, leads qualificados, status vendas, paginação, subtitles)

