# /contents 페이지 구현 계획

## Context

nextjs 앱의 데모 라우트에 두 가지 패턴을 추가한다:

1. **병렬 Promise SSR 스트리밍** — 기존 ssr/page.tsx는 getHealth()를 await한 뒤 getStats()를 시작해 사실상 직렬. 새 /contents 페이지는 두 Promise를 동시에 시작(병렬)해 각각 Suspense로 독립 스트리밍.
2. **검색 자동완성 + AbortController** — 입력마다 React Query가 내부 AbortController로 이전 in-flight 요청을 자동 취소. manual useRef 없이 `queryFn({ signal })` 패턴으로 취소 처리.

## 최종 라우트

`GET /contents` → Server Component 페이지

- 상단: SearchBox (CSR — 자동완성, 키 입력마다 이전 요청 취소)
- 중단: ContentFeatured (SSR 스트리밍 — featuredPromise)
- 하단: ContentList (SSR 스트리밍 — listPromise)

두 Promise는 동시 시작:

```ts
// ✅ 병렬 — 두 fetch 동시 시작
const listPromise = getContentList()
const featuredPromise = getFeaturedContent()

// ❌ 직렬 — list 완료 후 featured 시작 (느림)
const list = await getContentList()
const featured = await getFeaturedContent()
```

---

## 수정할 파일 (5개)

### 1. `packages/api-client/src/services/example.ts`

ExamplePaths에 3개 경로 추가:

```ts
'/contents': {
  get: { responses: { 200: { content: { 'application/json': { items: ContentItem[] } } } } }
}
'/featured': {
  get: { responses: { 200: { content: { 'application/json': FeaturedContent } } } }
}
'/search': {
  get: {
    parameters: { query: { q: string } }
    responses: { 200: { content: { 'application/json': { suggestions: string[] } } } }
  }
}
```

`ContentItem`, `FeaturedContent` interface도 선언.

### 2. `apps/nextjs/src/testing/mocks/handlers.ts`

```ts
http.get('*/api/contents', () => HttpResponse.json({ items: [...] }))
http.get('*/api/featured', () => HttpResponse.json({ id, title, summary }))
http.get('*/api/search', ({ request }) => {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  return HttpResponse.json({ suggestions: CONTENT_TITLES.filter(t => t.includes(q)) })
})
```

### 3. `eslint.config.js`

zones 배열에 추가:

```js
{ target: path.join(nextSrc, 'features/contents'), from: path.join(nextSrc, 'features'), except: ['./contents'] }
```

### 4. `apps/nextjs/src/app/page.tsx`

링크 추가:

```tsx
<li>
  <Link href="/contents">/contents</Link> — 병렬 Promise 스트리밍 + 검색 자동완성
</li>
```

### 5. `README.md`

데모 테이블에 2행 추가:

```
| nextjs | `/contents` | 병렬 Promise SSR 스트리밍 + 검색 자동완성 (AbortController) |
```

---

## 생성할 파일 (20개)

### feature API

**`features/contents/api/get-content-list.ts`** — `server-only`

```ts
import 'server-only'
export type ContentListProps = { state: 'ok'; items: ContentItem[] } | { state: 'fail' }
export const getContentList = async (): Promise<ContentListProps> => {
  try {
    const data = await exampleApi.request('/contents', { method: 'get' })
    return { state: 'ok', items: data.items }
  } catch {
    return { state: 'fail' }
  }
}
```

**`features/contents/api/get-featured-content.ts`** — `server-only`

```ts
import 'server-only'
export type FeaturedContentProps = { state: 'ok'; title: string; summary: string } | { state: 'fail' }
export const getFeaturedContent = async (): Promise<FeaturedContentProps> => { ... }
```

**`features/contents/api/use-search-suggestions.ts`** — `'use client'`

```ts
'use client'
export const searchKeys = {
  all: ['search'] as const,
  suggestions: (q: string) => [...searchKeys.all, 'suggestions', q] as const,
}
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    // signal: React Query 내부 AbortController — query key 변경 시 이전 요청 자동 취소
    queryFn: ({ signal }) =>
      exampleApi.request('/search', { method: 'get', params: { query: { q: query } }, signal }),
    enabled: query.length > 0,
    staleTime: 30_000,
  })
}
```

**`features/contents/api/index.ts`** — barrel

### feature components

**`components/content-list/content-list.tsx`**

- `ContentList(props: ContentListProps)` — presentational (fail 분기 포함)
- `async ContentListAsync({ promise })` — Suspense용 async SC

**`components/content-featured/content-featured.tsx`**

- `ContentFeatured(props: FeaturedContentProps)` — presentational
- `async ContentFeaturedAsync({ promise })` — Suspense용 async SC

**`components/search-box/search-box.tsx`** — `'use client'`

```tsx
'use client'
export function SearchBox() {
  const [query, setQuery] = useState('')
  const { data, isFetching } = useSearchSuggestions(query)
  // 입력마다 queryKey 변경 → React Query가 이전 signal.abort() → 새 요청 시작
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색어 입력" />
      {isFetching && <span>검색 중…</span>}
      {data?.suggestions.map((s) => (
        <div key={s}>{s}</div>
      ))}
    </div>
  )
}
```

각 component 폴더에 `.module.scss` + `.module.scss.d.ts` + `index.ts` 생성.

**`components/index.ts`** — outer barrel

### 라우트

**`app/contents/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

export default async function ContentsPage() {
  // 두 Promise 동시 시작 (병렬) — 순차 await보다 총 소요시간 단축
  const listPromise = getContentList()
  const featuredPromise = getFeaturedContent()

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>Contents — 병렬 Promise 스트리밍 + 자동완성</h1>
        </CardHeader>
        <CardBody>
          <section>
            <h2>검색 자동완성 (CSR + AbortController)</h2>
            <SearchBox /> {/* 'use client' — 입력마다 이전 요청 취소 */}
          </section>
          <section>
            <h2>Featured (SSR 스트리밍)</h2>
            <Suspense fallback={<p>로딩 중…</p>}>
              <ContentFeaturedAsync promise={featuredPromise} />
            </Suspense>
          </section>
          <section>
            <h2>목록 (SSR 스트리밍)</h2>
            <Suspense fallback={<p>로딩 중…</p>}>
              <ContentListAsync promise={listPromise} />
            </Suspense>
          </section>
        </CardBody>
        <CardFooter>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}
```

**`app/contents/loading.tsx`** — 라우트 레벨 Suspense fallback  
**`app/contents/error.tsx`** — `'use client'` error boundary

---

## 빌드 순서

1. `packages/api-client/src/services/example.ts` — ContentItem, FeaturedContent, ExamplePaths 확장
2. `apps/nextjs/src/testing/mocks/handlers.ts` — 3개 handler 추가
3. `features/contents/api/` — get-content-list, get-featured-content, use-search-suggestions, index
4. `features/contents/components/` — content-list, content-featured, search-box (scss 포함), index
5. `app/contents/page.tsx` + `loading.tsx` + `error.tsx`
6. `eslint.config.js` — zone 추가
7. `app/page.tsx` + `README.md` — 링크/데모 테이블 추가

---

## 검증

```bash
pnpm typecheck          # 전체 타입 에러 없음
pnpm lint               # ESLint zone 포함 에러 없음
pnpm --filter=nextjs dev  # localhost:3000/contents 접속
# - 검색창에 "Next" 입력 → 자동완성 노출, DevTools Network 탭에서 이전 요청 cancelled 확인
# - 새로고침 시 Featured/List가 각각 독립적으로 스트리밍되는 것 확인 (Network 탭 slow 3G 시뮬)
```
