import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../auth/me";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns user payload for valid token", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com", role: "authenticated" } },
          error: null,
        }),
      },
    });

    const request = new Request("https://test.local/api/auth/me", {
      headers: { authorization: "Bearer valid-token" },
    });

    const response = await onRequestGet({
      request,
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user.id).toBe("user-1");
  });

  it("returns 401 for invalid token", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid JWT" },
        }),
      },
    });

    const request = new Request("https://test.local/api/auth/me", {
      headers: { authorization: "Bearer invalid-token" },
    });

    const response = await onRequestGet({
      request,
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(401);
  });

  it("returns 500 when required env is missing", async () => {
    const request = new Request("https://test.local/api/auth/me", {
      headers: { authorization: "Bearer token" },
    });

    const response = await onRequestGet({ request, env: {} } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.code).toBe("MISCONFIGURED_ENV");
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
