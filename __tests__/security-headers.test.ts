import { describe, expect, it } from "vitest";
import { getSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("applies baseline browser hardening in every environment", () => {
    const headers = Object.fromEntries(
      getSecurityHeaders(false).map(({ key, value }) => [key, value])
    );

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("enables HSTS only for production deployments", () => {
    const headers = Object.fromEntries(
      getSecurityHeaders(true).map(({ key, value }) => [key, value])
    );

    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
  });

  it("returns fresh header objects so callers cannot mutate shared policy", () => {
    const first = getSecurityHeaders(false);
    first[0].value = "mutated";

    const second = getSecurityHeaders(false);
    expect(second[0].value).toBe("nosniff");
  });
});
