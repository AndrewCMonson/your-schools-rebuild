type RemoteRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": "yourschools-ingestion/1.0",
  Accept: "text/csv,application/json,text/plain,*/*",
};
const RETRIABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const REMOTE_FETCH_TIMEOUT_MS = Number.parseInt(process.env.INGESTION_FETCH_TIMEOUT_MS ?? "30000", 10);
const REMOTE_FETCH_MAX_RETRIES = Number.parseInt(process.env.INGESTION_FETCH_MAX_RETRIES ?? "2", 10);
const RETRY_DELAY_MS = Number.parseInt(process.env.INGESTION_FETCH_RETRY_DELAY_MS ?? "500", 10);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (error.name === "AbortError") return true;
  return message.includes("fetch failed") || message.includes("timeout") || message.includes("network");
}

async function requestRemote(url: string, init?: RemoteRequestInit) {
  const maxRetries = Number.isFinite(REMOTE_FETCH_MAX_RETRIES) ? Math.max(0, REMOTE_FETCH_MAX_RETRIES) : 0;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const timeoutSignal =
        Number.isFinite(REMOTE_FETCH_TIMEOUT_MS) && REMOTE_FETCH_TIMEOUT_MS > 0
          ? AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS)
          : undefined;
      const signal = init?.signal ?? timeoutSignal;

      const response = await fetch(url, {
        ...init,
        signal,
        headers: {
          ...DEFAULT_HEADERS,
          ...(init?.headers ?? {}),
        },
      });

      if (!response.ok) {
        if (attempt < maxRetries && RETRIABLE_STATUS_CODES.has(response.status)) {
          await delay(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw new Error(`Failed to fetch source data (${response.status})`);
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries && isRetriableError(error)) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to fetch source data after retries");
}

export async function fetchRemoteText(url: string, init?: RemoteRequestInit) {
  const response = await requestRemote(url, init);
  return response.text();
}

export async function fetchRemoteJson<T>(url: string, init?: RemoteRequestInit) {
  const response = await requestRemote(url, init);
  return (await response.json()) as T;
}
