export type SecurityHeader = { key: string; value: string };

const BASE_SECURITY_HEADERS: SecurityHeader[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

/**
 * Browser hardening applied to every route. HSTS is emitted only in production
 * so local HTTP development is never pinned to HTTPS by the browser.
 */
export function getSecurityHeaders(isProduction = process.env.NODE_ENV === "production"): SecurityHeader[] {
  const headers = BASE_SECURITY_HEADERS.map((header) => ({ ...header }));

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
