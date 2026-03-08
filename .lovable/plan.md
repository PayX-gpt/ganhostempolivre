

## Plano: 100% do tráfego para Variante A

Editar **`src/lib/abTestVariant.ts`**: mudar `ACTIVE_VARIANTS` de `["A", "C"]` para `["A"]`. Isso força todos os visitantes (novos e retornantes) para a Variante A. Usuários que tinham C serão reatribuídos automaticamente.

Atualizar o badge em **`src/components/LiveABTest.tsx`** de "Ativas: A + C (50/50)" para "Ativa: A (100%)".

