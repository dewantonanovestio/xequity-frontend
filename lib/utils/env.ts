const DEFAULT_API_URL = "http://localhost:3003";
const API_PROXY_PATH = "/backend";

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export function getApiRequestUrl(): string {
  return API_PROXY_PATH;
}

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

export function getEnvLabel(): string {
  const apiUrl = getApiUrl();

  try {
    return new URL(apiUrl).host || apiUrl;
  } catch {
    return apiUrl;
  }
}
