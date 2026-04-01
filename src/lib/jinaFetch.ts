// K-11, K-12: Jina.ai Reader API — URL content fetcher for URL ingestion (U-02)
// Security rules: never log the key, never store it anywhere except localStorage

const JINA_API_KEY_STORAGE_KEY = 'conceptforge:jina-api-key'
const JINA_TOKEN_BUDGET_STORAGE_KEY = 'conceptforge:jina-token-budget'
const JINA_TOKEN_BUDGET_DEFAULT = 10000
const JINA_READER_BASE = 'https://r.jina.ai/'

// K-11: Jina API key (optional — free tier works without it)
export function getJinaApiKey(): string | null {
  return localStorage.getItem(JINA_API_KEY_STORAGE_KEY)
}

export function setJinaApiKey(key: string): void {
  localStorage.setItem(JINA_API_KEY_STORAGE_KEY, key)
}

export function clearJinaApiKey(): void {
  localStorage.removeItem(JINA_API_KEY_STORAGE_KEY)
}

// K-12: token budget — how many tokens Jina may return (default 10000)
export function getJinaTokenBudget(): number {
  const stored = localStorage.getItem(JINA_TOKEN_BUDGET_STORAGE_KEY)
  if (!stored) return JINA_TOKEN_BUDGET_DEFAULT
  const n = parseInt(stored, 10)
  return isNaN(n) || n <= 0 ? JINA_TOKEN_BUDGET_DEFAULT : n
}

export function setJinaTokenBudget(n: number): void {
  localStorage.setItem(JINA_TOKEN_BUDGET_STORAGE_KEY, String(n))
}

// U-02: fetch URL content via Jina.ai Reader, returning markdown text
// Uses X-Return-Format: markdown (fixed — Option A) and X-Token-Budget from K-12
// Optionally sends Authorization: Bearer <key> from K-11
export async function fetchUrlContent(url: string): Promise<string> {
  const jinaUrl = `${JINA_READER_BASE}${url}`
  const headers: Record<string, string> = {
    Accept: 'text/plain',
    'X-Return-Format': 'markdown',
    'X-Token-Budget': String(getJinaTokenBudget()),
  }
  const apiKey = getJinaApiKey()
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const res = await fetch(jinaUrl, { headers })
  if (!res.ok) {
    throw new Error(`Jina fetch error ${res.status}: ${res.statusText}`)
  }
  const text = await res.text()
  if (!text.trim()) {
    throw new Error('Jina returned empty content for this URL')
  }
  return text
}
