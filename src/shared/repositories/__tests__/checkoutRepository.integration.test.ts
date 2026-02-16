import { afterEach, describe, expect, it, vi } from "vitest";
import { createCheckoutOrder } from "../checkoutRepository";

describe("createCheckoutOrder integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates order successfully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ orderId: "order-123" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const result = await createCheckoutOrder({
      total: 1000,
      customerName: "Иван",
      customerPhone: "+79000000000",
      address: "ул. Мира, 1",
      comment: "",
      paymentMethod: "cash",
      items: [{ title: "Pizza", qty: 1, price: 1000 }],
      idempotencyKey: "idem-1",
      accessToken: "token",
    });

    expect(result.orderId).toBe("order-123");
  });

  it("maps network timeout to diagnostic checkout error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            const timeoutError = new DOMException("aborted", "AbortError");
            setTimeout(() => reject(timeoutError), 0);
          }),
      ),
    );

    await expect(
      createCheckoutOrder({
        total: 1000,
        customerName: "Иван",
        customerPhone: "+79000000000",
        address: "ул. Мира, 1",
        comment: "",
        paymentMethod: "cash",
        items: [{ title: "Pizza", qty: 1, price: 1000 }],
        idempotencyKey: "idem-timeout",
        accessToken: "token",
      }),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });
});
