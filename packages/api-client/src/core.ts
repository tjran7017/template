import { ApiError } from './errors'
import type {
  PathOf,
  Method,
  RequestBody,
  RequestQuery,
  RequestParams,
  ResponseBody,
} from './types'

export interface Middleware {
  onRequest?: (
    init: RequestInit & { url: string },
  ) => (RequestInit & { url: string }) | Promise<RequestInit & { url: string }>
  onResponse?: (response: Response) => Response | Promise<Response>
}

export interface ServiceConfig {
  /** 서비스별 baseURL (게이트웨이 경유 시 path prefix만 다를 수 있음) */
  baseUrl: string
  /** 매 요청마다 호출되어 토큰을 가져옴 — lazy 평가로 토큰 갱신에 자동 대응 */
  getAuthToken?: () => string | null | Promise<string | null>
  /** 401 응답 시 호출 (예: 로그인 페이지 redirect, 토큰 리프레시) */
  onUnauthorized?: () => void | Promise<void>
  /** 테스트/SSR에서 fetch 주입 가능 */
  fetch?: typeof fetch
  /** 서비스별 추가 미들웨어 */
  middleware?: Middleware[]
}

/** path/메서드/요청/응답이 모두 OpenAPI 타입으로 추론되는 옵션 */
interface RequestOptions<Paths, P extends PathOf<Paths>, M extends Method<Paths, P>> {
  method: M
  // params는 path/query 모두 있을 때만 필수, 없으면 생략 가능
  params?: {
    path?: RequestParams<Paths, P, M>
    query?: RequestQuery<Paths, P, M>
  }
  body?: RequestBody<Paths, P, M>
  signal?: AbortSignal
  headers?: RequestInit['headers']
}

export function createServiceClient<Paths extends object>(config: ServiceConfig) {
  // fetch는 호출 시점에 해석 — globalThis.fetch를 가로채는 MSW/테스트 더블이
  // 모듈 로드 후에 패치되어도 정상 동작
  const resolveFetch = (): typeof fetch => config.fetch ?? globalThis.fetch

  type Primitive = string | number | boolean

  /** path 파라미터 치환: '/users/{id}' + { id: '1' } → '/users/1' */
  function fillPath(path: string, params?: Record<string, Primitive>): string {
    if (!params) return path
    return path.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = params[key]
      if (value === undefined) throw new Error(`Missing path param: ${key}`)
      return encodeURIComponent(String(value))
    })
  }

  function buildUrl(
    path: string,
    params: { path?: Record<string, Primitive>; query?: Record<string, Primitive> } | undefined,
  ): string {
    const filled = fillPath(path, params?.path)
    // baseUrl이 path prefix를 포함할 수 있으므로 (gateway 경유), URL 생성자 대신 string concat
    // new URL('/x', 'http://h/api') → 'http://h/x' (prefix 유실) 회피
    const base = config.baseUrl.replace(/\/$/, '')
    const url = new URL(base + filled)
    const query = params?.query
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  async function request<P extends PathOf<Paths>, M extends Method<Paths, P>>(
    path: P,
    opts: RequestOptions<Paths, P, M>,
  ): Promise<ResponseBody<Paths, P, M>> {
    let init: RequestInit & { url: string } = {
      url: buildUrl(String(path), {
        path: opts.params?.path as Record<string, Primitive> | undefined,
        query: opts.params?.query as Record<string, Primitive> | undefined,
      }),
      method: opts.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers as Record<string, string> | undefined),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    }

    // 인증 헤더 주입
    const token = await config.getAuthToken?.()
    if (token) {
      init.headers = {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      }
    }

    // 미들웨어 onRequest
    for (const mw of config.middleware ?? []) {
      if (mw.onRequest) init = await mw.onRequest(init)
    }

    const { url, ...fetchInit } = init
    let response = await resolveFetch()(url, fetchInit)

    // 미들웨어 onResponse
    for (const mw of config.middleware ?? []) {
      if (mw.onResponse) response = await mw.onResponse(response)
    }

    if (response.status === 401) await config.onUnauthorized?.()
    if (!response.ok) throw await ApiError.from(response)

    // 204 No Content 등 빈 응답 처리
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as ResponseBody<Paths, P, M>
  }

  return { request }
}

export type ServiceClient<Paths extends object> = ReturnType<typeof createServiceClient<Paths>>
