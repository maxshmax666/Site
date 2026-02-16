import { createClient } from "@supabase/supabase-js";
import { ensureRequiredApiEnv, methodNotAllowed, resolveSupabaseOrigin, type ApiEnv, json } from "../_utils";

type CreateOrderItemPayload = {
  title: string;
  qty: number;
  price: number;
};

type CreateOrderPayload = {
  total: number;
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string | null;
  paymentMethod?: "cash" | "sberbank_code";
  paymentCode?: string | null;
  items: CreateOrderItemPayload[];
};

const PAYMENT_METHODS = new Set(["cash", "sberbank_code"]);

type ErrorBody = {
  code: string;
  error: string;
  diagnosticCode: string;
};

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

function createDiagnosticCode(): string {
  return `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function validatePayload(payload: unknown): payload is CreateOrderPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const typedPayload = payload as Partial<CreateOrderPayload>;
  if (
    typeof typedPayload.total !== "number" ||
    typeof typedPayload.customerName !== "string" ||
    typeof typedPayload.customerPhone !== "string" ||
    typeof typedPayload.address !== "string" ||
    !Array.isArray(typedPayload.items)
  ) {
    return false;
  }

  if (typedPayload.paymentMethod !== undefined && !PAYMENT_METHODS.has(typedPayload.paymentMethod)) {
    return false;
  }

  if (typedPayload.paymentCode !== undefined && typedPayload.paymentCode !== null && typeof typedPayload.paymentCode !== "string") {
    return false;
  }

  return typedPayload.items.every((item) => {
    const typedItem = item as Partial<CreateOrderItemPayload>;
    return (
      typedItem &&
      typeof typedItem.title === "string" &&
      typeof typedItem.qty === "number" &&
      Number.isFinite(typedItem.qty) &&
      typeof typedItem.price === "number" &&
      Number.isFinite(typedItem.price)
    );
  });
}

function errorResponse(body: Omit<ErrorBody, "diagnosticCode">, status: number): Response {
  return json({ ...body, diagnosticCode: createDiagnosticCode() }, { status });
}

export const onRequest: PagesFunction<ApiEnv> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return methodNotAllowed("POST");
  }

  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return envError;
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return errorResponse({ code: "UNAUTHORIZED", error: "Unauthorized" }, 401);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey) {
    return errorResponse({ code: "MISSING_IDEMPOTENCY_KEY", error: "Idempotency key is required" }, 400);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse({ code: "INVALID_JSON", error: "Invalid request body" }, 400);
  }

  if (!validatePayload(payload)) {
    return errorResponse({ code: "INVALID_PAYLOAD", error: "Invalid checkout payload" }, 400);
  }

  const supabaseOrigin = resolveSupabaseOrigin(env);
  const supabase = createClient(supabaseOrigin!, env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { total, customerName, customerPhone, address, comment, paymentMethod, paymentCode, items } = payload;
  const normalizedPaymentMethod = paymentMethod && PAYMENT_METHODS.has(paymentMethod) ? paymentMethod : "cash";
  const normalizedPaymentCode = normalizedPaymentMethod === "sberbank_code" ? paymentCode?.trim() || null : null;

  const { data: orderId, error } = await supabase.rpc("create_order_with_items", {
    p_total: total,
    p_customer_name: customerName.trim(),
    p_customer_phone: customerPhone.trim(),
    p_address: address.trim(),
    p_comment: comment?.trim() || null,
    p_payment_method: normalizedPaymentMethod,
    p_payment_code: normalizedPaymentCode,
    p_items: items,
    p_idempotency_key: idempotencyKey,
  });

  if (error || !orderId) {
    console.error("ORDER_CREATE_FAILED", {
      code: error?.code ?? "UNKNOWN",
      message: error?.message ?? "Unknown RPC error",
      details: error?.details ?? null,
    });

    return errorResponse({ code: "ORDER_CREATE_FAILED", error: "Failed to create order" }, 502);
  }

  return json({ orderId }, { status: 200 });
};
