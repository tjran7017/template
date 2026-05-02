/** components.schemas.<K> 를 짧게 꺼냄 */
export type Schema<
  Components extends { schemas: Record<string, unknown> },
  K extends keyof Components['schemas'],
> = Components['schemas'][K]

/** Paths 객체에서 path 문자열만 추출 */
export type PathOf<Paths> = keyof Paths & string

/** HTTP 메서드 — paths[P] 안에 정의된 것만 허용 */
export type Method<Paths, P extends PathOf<Paths>> = keyof Paths[P] & string

/** 요청 바디 추출 — 예: RequestBody<UsersPaths, '/users', 'post'> */
export type RequestBody<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends {
  requestBody?: { content: { 'application/json': infer B } }
}
  ? B
  : never

/** 쿼리 파라미터 추출 */
export type RequestQuery<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends { parameters: { query?: infer Q } } ? Q : never

/** path 파라미터 추출 */
export type RequestParams<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends { parameters: { path?: infer P2 } } ? P2 : never

/** 200 응답 바디 추출 */
export type ResponseBody<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends {
  responses: { 200: { content: { 'application/json': infer R } } }
}
  ? R
  : never
