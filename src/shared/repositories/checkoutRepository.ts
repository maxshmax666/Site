import { ApiClientError } from "@/lib/apiClient";

export type CheckoutOrderItemInput = {
  title: string;
  qty: number;
  price: number;
};

export type CreateCheckoutOrderInput = {
  total: number;
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string;
  items: CheckoutOrderItemInput[];
  idempotencyKey: string;
  accessToken: string;
};

type CreateCheckoutOrderResponse = {
  orderId: string;
};

type CreateCheckoutOrderErrorResponse = {
  code?: string;
  error?: string;
  diagnosticCode?: string;
};

export type CheckoutMutationErrorCode =
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "ORDER_CREATE_FAILED"
  | "UNKNOWN";

export class CheckoutMutationError extends Error {
  code: CheckoutMutationErrorCode;
  diagnosticCode: string;

  constructor(message: string, code: CheckoutMutationErrorCode, diagnosticCode: string) {
    super(message);
    this.name = "CheckoutMutationError";
    this.code = code;
    this.diagnosticCode = diagnosticCode;
  }
}

function createDiagnosticCode() {
  return `CHK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function toCheckoutError(error: unknown): CheckoutMutationError {
  if (error instanceof CheckoutMutationError) {
    return error;
  }

  if (error instanceof ApiClientError) {
    return new CheckoutMutationError(error.message, error.code === "TIMEOUT" ? "TIMEOUT" : "NETWORK_ERROR", createDiagnosticCode());
  }

  return new CheckoutMutationError("Не удалось оформить заказ. Попробуйте снова.", "UNKNOWN", createDiagnosticCode());
}

export async function createCheckoutOrder(input: CreateCheckoutOrderInput): Promise<CreateCheckoutOrderResponse> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => abortController.abort(), 10_000);

  try {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.accessToken}`,
        "idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify({
        total: input.total,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        address: input.address,
        comment: input.comment,
        items: input.items,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      let errorPayload: CreateCheckoutOrderErrorResponse | null = null;

      try {
        errorPayload = (await response.json()) as CreateCheckoutOrderErrorResponse;
      } catch {
        errorPayload = null;
      }

      throw new CheckoutMutationError(
        errorPayload?.error ?? "Не удалось оформить заказ. Попробуйте снова.",
        (errorPayload?.code as CheckoutMutationErrorCode | undefined) ?? "ORDER_CREATE_FAILED",
        errorPayload?.diagnosticCode ?? createDiagnosticCode(),
      );
    }

    return (await response.json()) as CreateCheckoutOrderResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CheckoutMutationError("Таймаут сети при отправке заказа.", "TIMEOUT", createDiagnosticCode());
    }

    if (error instanceof TypeError) {
      throw new CheckoutMutationError("Сетевая ошибка при отправке заказа.", "NETWORK_ERROR", createDiagnosticCode());
    }

    throw toCheckoutError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}
