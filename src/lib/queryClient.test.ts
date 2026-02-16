import { describe, expect, it } from "vitest";
import { defaultRetry } from "./queryClient";

describe("defaultRetry", () => {
  it("does not retry unauthorized errors", () => {
    expect(defaultRetry(0, { status: 401 })).toBe(false);
  });

  it("retries timeout errors up to retry limit", () => {
    expect(defaultRetry(0, { code: "TIMEOUT" })).toBe(true);
    expect(defaultRetry(1, { code: "TIMEOUT" })).toBe(true);
    expect(defaultRetry(2, { code: "TIMEOUT" })).toBe(false);
  });

  it("retries 5xx errors but stops after limit", () => {
    expect(defaultRetry(0, { status: 503 })).toBe(true);
    expect(defaultRetry(2, { status: 503 })).toBe(false);
  });
});
