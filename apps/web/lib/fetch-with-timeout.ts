export async function fetchWithTimeout(
  input: string | URL | Request,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 60000, ...options } = init ?? {};

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(id);
  }
}
