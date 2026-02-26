import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  token: string;
  label: string;
  is_active: boolean;
  priority: number;
  messages_sent: number;
}

const ZAPI_BASE = "https://api.z-api.io";

async function checkInstanceHealth(inst: WhatsAppInstance, clientToken: string): Promise<boolean> {
  try {
    const url = `${ZAPI_BASE}/instances/${inst.instance_id}/token/${inst.token}/status`;
    const res = await fetch(url, {
      headers: { "Client-Token": clientToken },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.connected === true || data?.smartphoneConnected === true;
  } catch {
    return false;
  }
}

async function sendMessage(
  inst: WhatsAppInstance,
  clientToken: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; response?: any }> {
  try {
    const url = `${ZAPI_BASE}/instances/${inst.instance_id}/token/${inst.token}/send-text`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({ phone, message }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: `Z-API ${res.status}: ${JSON.stringify(data)}` };
    }
    return { success: true, response: data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function pickByLeastSent(instances: WhatsAppInstance[]): WhatsAppInstance[] {
  return [...instances].sort((a, b) => (a.messages_sent || 0) - (b.messages_sent || 0));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  if (!clientToken) {
    return new Response(JSON.stringify({ error: "ZAPI_CLIENT_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { phone, message, action } = await req.json();

    // Action: health-check all instances
    if (action === "health-check") {
      const { data: instances } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .order("priority", { ascending: true });

      const results = [];
      for (const inst of instances || []) {
        const healthy = await checkInstanceHealth(inst, clientToken);
        await supabase
          .from("whatsapp_instances")
          .update({
            health_status: healthy ? "connected" : "disconnected",
            is_active: healthy,
            last_health_check: new Date().toISOString(),
          })
          .eq("id", inst.id);
        results.push({ label: inst.label, healthy });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send message with round-robin distribution
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: instances } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("is_active", true);

    if (!instances || instances.length === 0) {
      return new Response(JSON.stringify({ error: "No active WhatsApp instances available" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sorted = pickByLeastSent(instances);

    for (const inst of sorted) {
      const healthy = await checkInstanceHealth(inst, clientToken);
      if (!healthy) {
        await supabase
          .from("whatsapp_instances")
          .update({
            health_status: "disconnected",
            is_active: false,
            last_health_check: new Date().toISOString(),
            last_error: "Health check failed before send",
          })
          .eq("id", inst.id);
        continue;
      }

      const result = await sendMessage(inst, clientToken, phone, message);
      if (result.success) {
        await supabase
          .from("whatsapp_instances")
          .update({
            messages_sent: (inst.messages_sent || 0) + 1,
            last_health_check: new Date().toISOString(),
            health_status: "connected",
          })
          .eq("id", inst.id);

        return new Response(
          JSON.stringify({
            success: true,
            instance_used: inst.label,
            distribution: `${inst.label} (${(inst.messages_sent || 0) + 1} msgs)`,
            response: result.response,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("whatsapp_instances")
        .update({
          last_error: result.error,
          health_status: "error",
          is_active: false,
          last_health_check: new Date().toISOString(),
        })
        .eq("id", inst.id);
    }

    return new Response(
      JSON.stringify({ error: "All instances failed. Please add/reconnect instances." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
