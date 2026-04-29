/** 최대 `retries`회 재시도하는 fetch 래퍼. 네트워크 오류와 5xx만 재시도한다. */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 2, initialDelay = 1000 } = {},
): Promise<Response> {
  let delay = initialDelay
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init)
      if (res.status >= 500 && attempt < retries) {
        await sleep(delay)
        delay *= 2
        continue
      }
      return res
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        await sleep(delay)
        delay *= 2
      }
    }
  }
  throw lastErr
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
