import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHONE_PATTERN = /^\+?[0-9()\-\s]{10,20}$/;

const LIMITS = {
  nameMax: 80,
  commentMax: 1000,
  guestsMin: 1,
  guestsMax: 5000,
  minMinutesBeforeEvent: 60,
  rateLimitWindowMinutes: 15,
  rateLimitMaxPerWindow: 3,
};

type CateringPayload = {
  name: string;
  phone: string;
  eventDateTime: string;
  guests: number;
  comment: string | null;
};

function normalizePhone(raw: string): string {
  const stripped = raw.trim().replace(/[()\-\s]/g, "");
  if (stripped.startsWith("8") && stripped.length === 11) {
    return `+7${stripped.slice(1)}`;
  }
  if (!stripped.startsWith("+") && stripped.length === 11 && stripped.startsWith("7")) {
    return `+${stripped}`;
  }
  if (!stripped.startsWith("+") && stripped.length === 10) {
    return `+7${stripped}`;
  }
  return stripped.startsWith("+") ? stripped : `+${stripped}`;
}

function parsePayload(payload: unknown): { value?: CateringPayload; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid payload" };
  }

  const { name, phone, eventDateTime, guests, comment } = payload as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > LIMITS.nameMax) {
    return { error: "Invalid name" };
  }

  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) {
    return { error: "Invalid phone" };
  }

  if (typeof eventDateTime !== "string") {
    return { error: "Invalid eventDateTime" };
  }

  const eventAt = new Date(eventDateTime);
  if (Number.isNaN(eventAt.getTime())) {
    return { error: "Invalid eventDateTime" };
  }

  const minDate = new Date(Date.now() + LIMITS.minMinutesBeforeEvent * 60_000);
  if (eventAt < minDate) {
    return { error: "eventDateTime must be at least 60 minutes in future" };
  }

  if (
    typeof guests !== "number" ||
    !Number.isInteger(guests) ||
    guests < LIMITS.guestsMin ||
    guests > LIMITS.guestsMax
  ) {
    return { error: "Invalid guests" };
  }

  if (comment !== null && comment !== undefined && typeof comment !== "string") {
    return { error: "Invalid comment" };
  }

  if (typeof comment === "string" && comment.trim().length > LIMITS.commentMax) {
    return { error: "Comment is too long" };
  }

  return {
    value: {
      name: name.trim(),
      phone: normalizePhone(phone),
      eventDateTime: eventAt.toISOString(),
      guests,
      comment: typeof comment === "string" ? comment.trim() : null,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Server is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed: Awaited<ReturnType<typeof req.json>>;
  try {
    parsed = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payloadResult = parsePayload(parsed);
  if (!payloadResult.value) {
    return new Response(JSON.stringify({ error: payloadResult.error ?? "Validation failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? null;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const windowStartIso = new Date(Date.now() - LIMITS.rateLimitWindowMinutes * 60_000).toISOString();

  const { count: recentCount, error: rateError } = await admin
    .from("catering_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", payloadResult.value.phone)
    .gte("created_at", windowStartIso);

  if (rateError) {
    return new Response(JSON.stringify({ error: "Rate limit check failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((recentCount ?? 0) >= LIMITS.rateLimitMaxPerWindow) {
    return new Response(
      JSON.stringify({ error: `Too many requests. Try again in ${LIMITS.rateLimitWindowMinutes} minutes.` }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { error: insertError } = await admin.from("catering_requests").insert({
    name: payloadResult.value.name,
    phone: payloadResult.value.phone,
    event_at: payloadResult.value.eventDateTime,
    guests: payloadResult.value.guests,
    comment: payloadResult.value.comment,
    source: "site",
    request_ip: ipAddress,
    user_agent: userAgent,
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: "Failed to persist request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
