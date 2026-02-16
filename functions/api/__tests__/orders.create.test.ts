import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../orders/create";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("POST /api/orders/create", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns orderId on success", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "order-1", error: null });
    createClientMock.mockReturnValue({ rpc });

    const request = new Request("https://test.local/api/orders/create", {
      method: "POST",
      headers: {
        authorization: "Bearer token",
        "idempotency-key": "idem-1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        total: 1000,
        customerName: "Иван",
        customerPhone: "+79000000000",
        address: "ул. Мира, 1",
        comment: "",
        items: [{ title: "Pizza", qty: 1, price: 1000 }],
      }),
    });

    const response = await onRequest({
      request,
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequest>[0]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orderId: "order-1" });
    expect(rpc).toHaveBeenCalledWith("create_order_with_items", expect.objectContaining({ p_idempotency_key: "idem-1" }));
  });

  it("returns error when order items insert fails inside transaction", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "Invalid order item payload" },
    });
    createClientMock.mockReturnValue({ rpc });

    const request = new Request("https://test.local/api/orders/create", {
      method: "POST",
      headers: {
        authorization: "Bearer token",
        "idempotency-key": "idem-fail",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        total: 1000,
        customerName: "Иван",
        customerPhone: "+79000000000",
        address: "ул. Мира, 1",
        comment: "",
        items: [{ title: "Pizza", qty: 0, price: 1000 }],
      }),
    });

    const response = await onRequest({
      request,
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequest>[0]);

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload.code).toBe("ORDER_CREATE_FAILED");
    expect(payload.diagnosticCode).toMatch(/^ORD-/);
  });

  it("returns same orderId for repeated submit with same idempotency key", async () => {
    const byKey = new Map<string, string>();
    const rpc = vi.fn().mockImplementation(async (_name: string, args: { p_idempotency_key: string }) => {
      const cached = byKey.get(args.p_idempotency_key);
      if (cached) {
        return { data: cached, error: null };
      }

      const created = "order-idem-1";
      byKey.set(args.p_idempotency_key, created);
      return { data: created, error: null };
    });

    createClientMock.mockReturnValue({ rpc });

    const makeRequest = () =>
      new Request("https://test.local/api/orders/create", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "idempotency-key": "idem-same",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          total: 1000,
          customerName: "Иван",
          customerPhone: "+79000000000",
          address: "ул. Мира, 1",
          comment: "",
          items: [{ title: "Pizza", qty: 1, price: 1000 }],
        }),
      });

    const firstResponse = await onRequest({
      request: makeRequest(),
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequest>[0]);

    const secondResponse = await onRequest({
      request: makeRequest(),
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequest>[0]);

    expect(await firstResponse.json()).toEqual({ orderId: "order-idem-1" });
    expect(await secondResponse.json()).toEqual({ orderId: "order-idem-1" });
  });
});
