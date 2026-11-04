export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}
const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export async function request<T = void>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')
  if (options.body) headers.set('Content-Type', 'application/json')
  const csrf = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))
  if (csrf) headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf.slice('XSRF-TOKEN='.length)))
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal ?? AbortSignal.timeout(15000),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar. Confira sua conexão e tente novamente.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Sua sessão expirou. Entre novamente para continuar.',
      403: 'Você não tem permissão para realizar esta ação.',
      419: 'Sua sessão de segurança expirou. Tente novamente.',
      429: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
    }
    if (response.status === 401) window.dispatchEvent(new Event('auth:expired'))
    throw new ApiError(
      response.status,
      messages[response.status] ??
        (response.status >= 500
          ? 'O serviço está indisponível. Tente novamente em instantes.'
          : (body?.message ?? 'Não foi possível concluir a solicitação.')),
      body?.errors ?? {},
    )
  }
  return body as T
}
export async function mutate<T = void>(
  path: string,
  data: unknown = {},
  method = 'POST',
): Promise<T> {
  await request('/sanctum/csrf-cookie')
  return request<T>(path, { method, body: JSON.stringify(data) })
}
