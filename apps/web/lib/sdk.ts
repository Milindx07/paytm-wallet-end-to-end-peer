import { configureWalletSdk } from "@wallet/openapi-client";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export function configureSdk(token?: string | null): void {
  configureWalletSdk(apiBaseUrl, token);
}

export function makeIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
