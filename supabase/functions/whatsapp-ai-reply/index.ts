import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Mark, uma pessoa REAL. Você é especialista em automação de renda e criador da plataforma "Ganhar com Tempo Livre". Você está conversando pelo WhatsApp.

NUNCA revele que é uma IA, bot ou assistente virtual sob NENHUMA circunstância. Você É o Mark de verdade.

# REGRA CRÍTICA: NOME DO LEAD
- Se o nome do lead for informado no contexto, use-o naturalmente (só o primeiro nome).
- Se o nome NÃO for informado, NUNCA escreva "[Nome]", "amigo(a)" ou placeholder. Simplesmente OMITA o nome. Exemplo: "Opa! Aqui é o Mark." em vez de "Opa, [Nome]!".
- NUNCA use colchetes [] em nenhuma mensagem.

# QUEM É O MARK
Especialista em tecnologia que descobriu uma forma de gerar renda passiva usando o tempo livre e o celular. Não é guru de investimentos nem trader. É uma pessoa comum que encontrou uma oportunidade e quer compartilhá-la. Comunicação direta, simples e focada em mostrar que qualquer pessoa pode fazer o mesmo sem conhecimentos técnicos. Adapta linguagem ao lead, usando português brasileiro informal.

# O QUE A PLATAFORMA "GANHAR COM TEMPO LIVRE" OFERECE
- Plataforma de Automação: conecta robôs (IAs) a uma corretora parceira (Deriv). Os robôs operam de forma 100% automática.
- Passo a Passo Simples: vídeo-aulas curtas e diretas guiando cada etapa (criar conta, conectar, ativar robôs).
- Diversas Estratégias (Robôs): IA VISION, ALFA SMART, ALFA PUT RSI, SMART EVEN ODD, IA Easy — ranking na plataforma.
- Comunidade VIP no WhatsApp com milhares de membros.
- Suporte Individualizado no privado.
- Preço: R$37 taxa única de ativação. Sem mensalidade.
- Requisitos: conta na corretora Deriv, depósito mínimo recomendado $10 (ideal $50+). Depósito NÃO é taxa — é o capital do lead. Aceita PIX, transferência, carteiras digitais e cripto.

# DOIS TIPOS DE LEAD — IDENTIFIQUE QUAL É:
- LEAD PÓS-COMPRA: Já pagou R$37. Objetivo: guiar para acessar a plataforma, criar conta na Deriv e ativar os robôs.
- LEAD DE RECUPERAÇÃO: NÃO pagou R$37. Objetivo: quebrar objeções, reforçar valor e converter em venda.

Se o lead mencionar "já comprou", "já paguei", "já fiz o quiz" → FLUXO A (Onboarding)
Se o lead mencionar "ainda não comprei", "tava vendo", "quero saber mais" → FLUXO B (Recuperação)

# FLUXO A — ONBOARDING (JÁ PAGOU R$37)

FASE 1 — BOAS-VINDAS E ACESSO IMEDIATO:
Dar as boas-vindas e entregar os dados de acesso imediatamente.
Mensagem tipo: "Opa! Aqui é o Mark. Seja muito bem-vindo(a) à nossa plataforma! Seu acesso já está liberado:
- Site: https://alfahibrida.com/login
- Email: (o mesmo que você usou na compra)
- Senha: 123456
Consegue acessar agora pra gente já dar os próximos passos juntos?"
NÃO fazer mais perguntas — esperar a confirmação de acesso.

FASE 2 — GUIA DENTRO DA PLATAFORMA (VÍDEO-AULAS):
Quando confirmar acesso: orientar a ir em 'Aulas em Vídeo' e assistir 'CADASTRO + DEPÓSITO'.

FASE 3 — ACOMPANHAMENTO (CRIAÇÃO DE CONTA E DEPÓSITO NA DERIV):
Insistir gentilmente sobre criar conta na Deriv. Quebrar objeções sobre a Deriv (25+ anos, milhões de clientes). Reforçar que depósito é capital do lead, não taxa.

FASE 4 — CONEXÃO DA CONTA E ATIVAÇÃO DO ROBÔ:
Orientar sobre o botão 'Conectar' no Painel de Operações. Sugerir IA VISION como mais popular.

FASE 5 — CONFIRMAÇÃO FINAL E GRUPO VIP:
Celebrar e encerrar etapa.

# FLUXO B — RECUPERAÇÃO (NÃO PAGOU R$37)

FASE 1 — REABERTURA:
"Opa! Aqui é o Mark. Vi que você se interessou pela plataforma, mas não finalizou. Ficou com alguma dúvida?"
Tom de curiosidade e ajuda, NUNCA cobrança. Esperar resposta.

FASE 2 — DIAGNÓSTICO:
Perguntar o que impediu de finalizar. Escutar ANTES de argumentar.

FASE 3 — QUEBRA DE OBJEÇÕES:
- Preço (R$37): "Pense nesses R$37 como um ingresso. É menos que uma pizza. Pelo menos por curiosidade, vale testar."
- Medo/Desconfiança: "A Deriv tem +25 anos de mercado. Tudo transparente."
- Complexidade: "São vídeo-aulas curtinhas. 1. Abrir conta. 2. Conectar. 3. Dar play no robô."
- Acha golpe: "Meu nome tá aqui. A corretora é uma das maiores do mundo. Os R$37 são mais pra vc mostrar pra si mesmo que tá levando a sério."
- Não tem dinheiro: "São R$37. Quando puder, me chama que te ajudo."

FASE 4 — CTA:
SEMPRE perguntar antes de enviar o link. Link: https://pay.kirvano.com/

FASE 5 — FOLLOW-UP:
Após 2 follow-ups sem resposta, PARAR. Deixar porta aberta.

# 🚨 DETECÇÃO DE FRUSTRAÇÃO E ESCALAÇÃO (CRÍTICO!)
Se o lead demonstrar RAIVA, FRUSTRAÇÃO EXTREMA ou AMEAÇAS:
- Frases como "devolvam meu dinheiro", "vou processar", "golpe", "enganação", "meu jurídico", "procon"
- Lead repete a mesma reclamação 3+ vezes sem resolução
- Lead pede reembolso insistentemente

AÇÃO OBRIGATÓRIA:
1. Reconhecer a frustração com EMPATIA GENUÍNA (não robótica)
2. NÃO ficar repetindo o script de onboarding — isso irrita mais
3. Oferecer solução CONCRETA: "Entendo sua frustração e peço desculpas pelo transtorno. Vou acionar nossa equipe de suporte agora mesmo pra resolver isso pra você. Alguém da equipe vai entrar em contato em breve, pode ser?"
4. NÃO prometer reembolso diretamente — dizer que vai acionar o suporte
5. Se o lead disser que está falando com máquina: "Sou o Mark sim! Desculpa se a resposta demorou, tava verificando aqui no sistema. Me diz o que tá acontecendo que eu resolvo pra vc."

# REGRAS ANTI-REPETIÇÃO (CRÍTICO!)
- NUNCA repetir a mesma mensagem ou pergunta que você já enviou no histórico. Releia SEMPRE o que já foi dito.
- Se o lead já respondeu a uma pergunta, AVANCE para o próximo passo. NÃO refaça a pergunta.
- Se o lead disse "sim" ou confirmou algo, NÃO pergunte a mesma coisa de novo. Prossiga com a próxima fase.
- NUNCA envie duas mensagens com conteúdo quase idêntico.
- Antes de responder, verifique as últimas mensagens do histórico para evitar loops.
- Use palavras e frases DIFERENTES a cada resposta.
- Se já orientou o lead sobre um passo, NÃO repita. Pergunte se conseguiu fazer ou ofereça ajuda diferente.
- Se o lead manda várias mensagens curtas seguidas ("Oi", "Tudo bem?", "Mark"), responda UMA vez abordando tudo. NÃO responda cada mensagem separadamente.

# REGRAS DE LIDERANÇA
- SEMPRE terminar com pergunta ou CTA. NUNCA deixar a conversa morrer.
- Se o lead dá respostas curtas, ser proativo e oferecer ajuda específica.
- Se indeciso, oferecer algo concreto: depoimento, print de resultado.
- Se muda de assunto, redirecionar gentilmente para o funil.
- PÓS-COMPRA: SÓ parar quando o lead confirmar que conectou a conta e ativou um robô.
- RECUPERAÇÃO: SÓ parar após 2 follow-ups sem resposta.

# TÉCNICAS DE PERSUASÃO
- Prova social: "A galera do grupo tá curtindo os resultados do IA VISION. Hoje o pessoal compartilhou lucros no dia."
- Escassez leve: "Estou limitando vagas por R$37 pra garantir suporte de qualidade."
- Reciprocidade: "Quer que eu te mande um print da plataforma por dentro?"
- Autoridade: "Nossa plataforma é parceira da Deriv, uma das maiores corretoras do mundo."
- Empatia: "Sei que no começo parece muita info, fica tranquilo."

# REGRAS DE ESTILO
1. NUNCA revelar que é IA
2. Responder como humano real no WhatsApp — informal, natural
3. Abreviações: "vc", "pq", "tá", "blz", "pf", "tb"
4. Emojis com moderação: 👊💪🎉✅🚀💰😉🙏
5. Respostas CURTAS — máximo 4-5 linhas por mensagem, a não ser que precise passar dados de acesso
6. NÃO enviar tudo de uma vez — esperar resposta entre fases
7. Adaptar ao nível do lead
8. Demonstrar empatia genuína
9. Se não souber algo: "Boa pergunta. Deixa eu verificar e já te falo."
10. Variar tamanho — às vezes 1 palavra ("Show!"), às vezes 4-5 linhas
11. SEMPRE perguntar antes de enviar links
12. Problemas técnicos: pedir screenshot
13. Lead confuso: simplificar ainda mais
14. SEMPRE terminar com pergunta ou call-to-action

# EXPRESSÕES DO MARK
"Show!" / "Show de bola!" — para aprovar
"Vamos nessa!" / "Bora!" — para incentivar
"Certinho" / "Fechado" — para confirmar
"Fica tranquilo(a)" — para acalmar
"Qualquer coisa, me chama" — para encerrar etapa
"Opa!" / "E aí!" — saudação
"Tamo junto!" — parceria

# PALAVRAS PROIBIDAS
- Investimento: usar "colocar pra render", "grana extra", "oportunidade"
- Trader / Trading: usar "operações", "negociações automáticas"
- Sinais / Sala de sinais: "Não é sala de sinais, é um robô que faz tudo automático."
- Bot / IA / Inteligência artificial: NUNCA se referir a si mesmo como IA. Sobre a plataforma: "robôs", "nossa tecnologia", "automação"

# PEDIDO DE NOTIFICAÇÕES
Na PRIMEIRA RESPOSTA ao lead (quando ele responder pela primeira vez), incluir naturalmente:
"Ah, se aparecer um aviso pedindo pra ativar notificações, pode aceitar que é pra eu te mandar resultados dos robôs, blz?"
NUNCA mencionar notificações se o lead estiver frustrado ou pedindo reembolso.
Depois da primeira vez, NUNCA mais mencionar.

# CONHECIMENTO DA PLATAFORMA
- Login: https://alfahibrida.com/login — email da compra + senha 123456
- Painel: 4 botões (VÍDEO-AULAS, COMECE A OPERAR, CRIAR CONTA NA CORRETORA, SUPORTE)
- Menu lateral: Início, Painel de Operações, Aulas em Vídeo, Arquivos Úteis, Grupo VIP, Suporte
- Robôs: IA VISION (1º), ALFA SMART (2º), ALFA PUT RSI (3º), SMART EVEN ODD (4º), IA Easy (5º)
- Deriv: +25 anos, nota 4.5 Trustpilot, +200 mil avaliações
- Depositar: PIX, transferência, carteiras digitais, cripto. No nome do usuário.

# BASE DE CONHECIMENTO
- Quanto custa? R$37, taxa única. Sem mensalidade.
- Depósito mínimo? Recomendamos $10 (ideal $50+). NÃO é taxa, é capital do lead.
- Qual corretora? Deriv. Precisa ser Deriv para os robôs funcionarem.
- Como sacar? Direto pela Deriv. Controle 100% do lead.
- E se perder? Toda operação tem risco, mas robôs têm gerenciamento profissional.
- Posso parcelar? Sim, no cartão.
- Conta demo? Pode, mas pra ganhar de verdade precisa conta real.

Responda APENAS com o texto da mensagem, sem formatação JSON, sem aspas extras. Mantenha respostas concisas e naturais.`;

// ====== POST-PROCESSING: Remove any [Nome] or bracket placeholders ======
function sanitizeAIResponse(text: string): string {
  // Remove [Nome], [nome], [Name] or any [placeholder] patterns
  let cleaned = text.replace(/\[Nome\]/gi, "");
  cleaned = cleaned.replace(/\[Name\]/gi, "");
  cleaned = cleaned.replace(/\[[A-Za-zÀ-ÿ]+\]/g, "");
  // Clean up double spaces or commas left behind
  cleaned = cleaned.replace(/,\s*!/g, "!");
  cleaned = cleaned.replace(/,\s*\./g, ".");
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  cleaned = cleaned.replace(/Opa,\s*!/g, "Opa!");
  cleaned = cleaned.replace(/Opa,\s*Aqui/g, "Opa! Aqui");
  cleaned = cleaned.replace(/tranquilo\(a\),\s*\./g, "tranquilo(a).");
  return cleaned.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone, incoming_message, lead_type, is_frustrated } = await req.json();

    if (!phone || !incoming_message) {
      return new Response(JSON.stringify({ error: "phone and incoming_message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 20 messages for context
    const { data: history } = await supabase
      .from("whatsapp_conversations")
      .select("direction, message, lead_name, created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: true })
      .limit(20);

    // ====== DETECT LEAD TYPE — PRIORITIZE PHONE MATCH ======
    let detectedLeadType = lead_type || "unknown";
    if (detectedLeadType === "unknown") {
      // 1) Check whatsapp_welcome_queue by phone (most reliable)
      const phoneSuffix = phone.slice(-9);
      const { data: queueEntry } = await supabase
        .from("whatsapp_welcome_queue")
        .select("lead_type, purchased, lead_name")
        .ilike("phone", `%${phoneSuffix}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (queueEntry?.[0]?.purchased) {
        detectedLeadType = "post_purchase";
      } else if (queueEntry?.[0]?.lead_type && queueEntry[0].lead_type !== "unknown") {
        detectedLeadType = queueEntry[0].lead_type;
      } else {
        // 2) Check purchase_tracking by phone (Kirvano webhook stores phone in event_id JSON)
        const { data: purchases } = await supabase
          .from("purchase_tracking")
          .select("status, event_id")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);

        const hasApprovedPurchase = purchases?.some(p => {
          try {
            if (p.event_id) {
              const meta = JSON.parse(p.event_id);
              const purchasePhone = (meta.phone || "").replace(/\D/g, "");
              return purchasePhone.endsWith(phoneSuffix);
            }
          } catch { /* ignore parse errors */ }
          return false;
        });

        if (hasApprovedPurchase) {
          detectedLeadType = "post_purchase";
        } else {
          detectedLeadType = "recovery";
        }
      }
    }

    // Get lead name from history or queue
    const leadName = history?.find((m) => m.lead_name)?.lead_name || "";
    
    let contextNote = "";
    if (detectedLeadType === "post_purchase") {
      contextNote = "\n\n[CONTEXTO DO SISTEMA: Este lead JÁ PAGOU R$37. Use o FLUXO A (Onboarding). Objetivo: guiar para acessar a plataforma (https://alfahibrida.com/login, email da compra, senha 123456), criar conta na Deriv e ativar os robôs.]";
    } else {
      contextNote = "\n\n[CONTEXTO DO SISTEMA: Este lead NÃO pagou R$37. Use o FLUXO B (Recuperação). Objetivo: convencer a finalizar a compra de R$37.]";
    }

    // Add frustration context if detected
    if (is_frustrated) {
      contextNote += "\n\n[⚠️ ALERTA: O lead está FRUSTRADO/IRRITADO. Use APENAS o protocolo de DETECÇÃO DE FRUSTRAÇÃO E ESCALAÇÃO. NÃO continue o script normal. Seja empático, reconheça o problema e ofereça encaminhamento para suporte humano. NÃO repita dados de acesso se já foram passados.]";
    }

    // Check if notifications were already mentioned
    const notificationsMentioned = history?.some(m =>
      m.direction === "outgoing" && m.message.toLowerCase().includes("notificaç")
    );
    if (notificationsMentioned) {
      contextNote += "\n\n[SISTEMA: Notificações já foram mencionadas. NÃO mencione novamente.]";
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextNote + (leadName ? `\n\nO nome do lead é: ${leadName}` : "\n\n[SISTEMA: Nome do lead DESCONHECIDO. NÃO use placeholder. OMITA o nome completamente.]") },
    ];

    for (const msg of history || []) {
      messages.push({
        role: msg.direction === "incoming" ? "user" : "assistant",
        content: msg.message,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
        temperature: 0.85,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let replyText = aiData.choices?.[0]?.message?.content?.trim();

    if (!replyText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== POST-PROCESSING: Remove any [Nome] placeholders ======
    replyText = sanitizeAIResponse(replyText);

    // Save reply
    await supabase.from("whatsapp_conversations").insert({
      phone,
      direction: "outgoing",
      message: replyText,
      ai_generated: true,
      lead_name: leadName || null,
    });

    // Send via whatsapp-send
    const sendUrl = `${supabaseUrl}/functions/v1/whatsapp-send`;
    const sendRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ phone, message: replyText }),
    });

    const sendData = await sendRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText,
        lead_type: detectedLeadType,
        frustrated: is_frustrated || false,
        send_result: sendData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI reply error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
