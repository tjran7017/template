# @repo/config

ESLint, TypeScript, Prettier 공통 설정 패키지. 모든 앱과 패키지가 동일한 코드 품질 기준을 따르도록 강제.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** config 패키지 특화 규약 — 설정 변경 시 영향 범위, 새 preset 추가 절차

## 패키지 목적

- 코드 품질 / 포맷 / 타입 검사 기준을 한 곳에 집중
- 새 앱/패키지가 항상 같은 출발점에서 시작
- 의존 방향 같은 아키텍처 규칙을 ESLint로 **강제** (루트 CLAUDE.md의 규칙이 코드 레벨에서 실제로 작동하도록)

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일                                 | 패키지가 하지 않는 일                            |
| ------------------------------------------------ | ------------------------------------------------ |
| ESLint / TypeScript / Prettier 공통 설정 export  | 앱별 / 패키지별 특수 규칙 정의 (사용처가 extend) |
| 환경별 preset 분리 (next / vite-react / library) | 단일 거대 설정 강제                              |
| import 의존 방향 / 네이밍 / strict 규칙 강제     | 도메인 / 비즈니스 로직 검사                      |

## 디렉토리 구조

```
packages/config/
├── eslint/
│   ├── base.js              모든 환경 공통 (TS, import 순서, prettier)
│   ├── react.js             base + React / Hooks / a11y
│   ├── next.js              react + Next.js 플러그인
│   ├── vite-react.js        react + Vite/SPA 특화
│   └── library.js           base + 라이브러리/패키지용 (React 비종속)
├── typescript/
│   ├── base.json            공통 strict
│   ├── next.json            base + Next.js (jsx: preserve, DOM lib)
│   ├── vite.json            base + Vite (jsx: react-jsx, DOM lib)
│   └── library.json         base + 패키지용 (declaration, composite, dist outDir)
├── prettier/
│   └── index.js             단일 prettier 설정
├── package.json             실제 exports / dependencies는 여기 참조
└── CLAUDE.md
```

> **TypeScript 소스 없음** — `.js` + `.json`만 export하므로 `tsconfig.json` / `typecheck` 스크립트 없음. turbo가 자동으로 skip.

## 공개 API

[`package.json`](./package.json)의 `exports` 필드로 명시. 카테고리:

- `./eslint/{base,react,next,vite-react,library}` — 환경별 ESLint preset
- `./typescript/{base,next,vite,library}` — 환경별 tsconfig preset
- `./prettier` — 단일 Prettier 설정

> ESLint와 TypeScript는 `peerDependencies` (`>=9` / `>=5.6`) — 사용처가 자기 버전을 가짐. 플러그인은 모두 `dependencies`로 묶어 한 번에 들어옴.

## preset별 책임

### `eslint/base.js` — 모든 환경 공통

- `typescript-eslint`의 `recommendedTypeChecked` 베이스
- `eslint-plugin-import-x` (flat config 네이티브 지원, `'import'` 키로 등록 → 규칙명 prefix는 `import/` 그대로)
- `eslint-config-prettier` (Prettier 충돌 방지, 마지막 적용)
- `projectService: { allowDefaultProject: ['*.js', '*.mjs', '*.cjs'] }` — 루트의 JS 설정 파일도 type-aware lint 가능

핵심 규칙:

- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/consistent-type-imports: error` (inline fix style)
- `import/order: error` (외부 → workspace `@repo/*` → 절대 `@/*` → 상대, 그룹 사이 빈 줄)
- `import/no-cycle: error`
- `no-console: ['error', { allow: ['warn', 'error'] }]`

### `eslint/react.js` — React 공통

- `base.js` 확장
- `eslint-plugin-react` (자동 detect, React 19 대응)
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `react/react-in-jsx-scope: off` (React 17+)
- `react-hooks/rules-of-hooks: error`, `exhaustive-deps: warn`

### `eslint/next.js` — Next.js 앱

- `react.js` 확장 + `@next/eslint-plugin-next`
- Next.js recommended + core-web-vitals 규칙 활성화
- `react/jsx-no-target-blank: off` (Next Link가 처리)

### `eslint/vite-react.js` — Vite + React SPA

- `react.js` 확장 (현재는 얇은 wrapper)
- 앱 특화 zone (`import/no-restricted-paths` 등)은 사용처 `eslint.config.js`에서 정의

### `eslint/library.js` — 라이브러리/패키지

- `base.js` 확장 (React 비의존)
- `import/no-default-export: error` (named export 강제)
- `@typescript-eslint/explicit-module-boundary-types: error` (외부 노출 함수는 타입 명시)
- `no-restricted-globals` — `window`, `document`, `navigator`, `location` 금지

## TypeScript preset

### `typescript/base.json` — 공통 strict

[`typescript/base.json`](./typescript/base.json) 참조. 핵심 옵션:

- `target: ES2022`, `lib: ['ES2022']`, `module: ESNext`, `moduleResolution: bundler`
- `strict: true` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true` — type-only import/export 명시 강제 (esModuleInterop 비호환이라 미사용)
- `isolatedModules: true` — esbuild/swc 등 단일 파일 트랜스파일러 호환

### 환경별 preset

- `next.json` — `lib: [DOM, DOM.Iterable, ES2022]`, `jsx: preserve`, `allowJs: true`, `plugins: [{name: next}]`
- `vite.json` — `lib: [DOM, DOM.Iterable, ES2022]`, `jsx: react-jsx`
- `library.json` — `declaration + declarationMap + composite: true`, `outDir: dist`, `rootDir: src` (소스 직접 export하지 않고 빌드 산출물을 export하는 패키지용 — 단, 본 모노레포는 source-export 기본이라 사용처에서 `composite: false`로 override할 수 있음)

## Prettier

[`prettier/index.js`](./prettier/index.js) 참조. 옵션:
`semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `arrowParens: 'always'`, `endOfLine: 'lf'`.

루트 CLAUDE.md "코딩 컨벤션 (전역)" 섹션과 일관. 변경 시 양쪽 동기화.

## 변경 영향 범위

이 패키지는 **모든 앱과 패키지에 영향**을 미침. 변경 시 다음을 반드시 검증:

| 변경 종류                          | 검증 항목                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| ESLint 규칙 추가                   | 모든 워크스페이스에서 `pnpm lint` 통과. 통과 안 되면 사전에 코드 마이그레이션 PR 분리 |
| ESLint 규칙 강화 (warn → error)    | 위와 동일 + 충분한 사전 공지                                                          |
| TypeScript 옵션 강화 (strict 관련) | `pnpm typecheck` 모든 워크스페이스 통과                                               |
| Prettier 옵션 변경                 | `pnpm prettier --write .` 일괄 실행 후 별도 PR로 적용 (diff가 거대해지므로)           |
| 새 ESLint 플러그인 추가            | `dependencies`에 등록 (peerDependency 아님 — 사용처가 자동으로 받음)                  |

## 새 preset 추가 절차

새로운 환경(예: Node.js 서버, React Native)이 모노레포에 추가될 때:

1. **`<area>/<environment>.{js|json}` 파일 생성** — 기존 base를 확장
2. **`package.json`의 `exports`에 등록**
3. **이 문서의 "preset별 책임" 섹션에 항목 추가**
4. **`README.md`의 사용 예시 표에 항목 추가**
5. **사용처에서 `extends` / `import` 변경**

## 알려진 제약 / 주의사항

- **루트 `eslint.config.js`는 패키지 ignore에 `packages/config/eslint/**`, `packages/config/prettier/**` 포함** — 이 메타 설정 파일들이 자기 자신을 lint하면 순환 발생
- **`composite: true` + `rootDir: "src"` 패키지에 `scripts/`나 외부 파일이 있으면 ESLint projectService가 못 찾음** — 패키지 tsconfig에서 `composite: false`로 override하고 `include`에 추가 필요 (api-client/ui 사례)
- **flat config 환경에서 nested `eslint.config.js`는 작동하지 않음** — lint-staged가 root에서 실행되므로 모든 패키지 규칙은 root config에서 처리. 패키지별 오버라이드도 root에서 `files:` glob으로 정의

## Claude Code 변경 시 체크리스트

- [ ] 새 규칙 추가 시 모든 워크스페이스의 `pnpm lint` / `pnpm typecheck`가 통과하는가
- [ ] 규칙이 *모든 환경 공통*이면 `base`에, *React만*이면 `react`에, *환경 특화*면 환경별 preset에 두었는가
- [ ] 추가한 ESLint 플러그인을 `dependencies`에 등록했는가 (peerDependency 아님)
- [ ] Prettier 옵션 변경 시 루트 CLAUDE.md "코딩 컨벤션" 섹션과 일치하는가
- [ ] preset 변경이 _모든 사용처를 즉시 깨는_ 종류라면 코드 마이그레이션 PR을 분리했는가
- [ ] 새 preset이 추가됐다면 `package.json` exports + 본 문서 "preset별 책임" + README 표 모두 갱신했는가
- [ ] React/Next.js 등 프레임워크 의존 규칙을 `library.js`에 넣지 않았는가
- [ ] `verbatimModuleSyntax`와 충돌하는 옵션(`esModuleInterop` 등)을 추가하지 않았는가
