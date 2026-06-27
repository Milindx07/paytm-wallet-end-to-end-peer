import { OpenAPI } from "./generated/index.js";

export * from "./generated/index.js";
export { OpenAPI };

export function configureWalletSdk(baseUrl: string, token?: string | null): void {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  OpenAPI.BASE = normalizedBaseUrl;
  OpenAPI.TOKEN = token || undefined;
}
