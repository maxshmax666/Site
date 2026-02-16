import { describe, expect, it } from "vitest";
import { createSberbankPaymentCode } from "./sberCode";

describe("createSberbankPaymentCode", () => {
  it("builds deterministic code from order amount", () => {
    expect(createSberbankPaymentCode(1140)).toBe("SBER|TAGIL_PIZZA|114000|9047");
  });

  it("normalizes invalid amount to zero", () => {
    expect(createSberbankPaymentCode(Number.NaN)).toBe("SBER|TAGIL_PIZZA|0|3890");
  });
});
