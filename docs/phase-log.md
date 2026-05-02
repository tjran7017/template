# Phase 구현 로그

코드나 계획서에서 바로 알 수 없는 **결정 사항과 인수인계 메모**만 기록.

---

## Phase 0 — 완료

**PR**: [#2](https://github.com/tjran7017/template/pull/2) (`feat/phase-0-monorepo-skeleton`)  
**상태**: PR 오픈, main 미머지

### 결정 사항

| 항목                        | 결정                                | 이유                                                     |
| --------------------------- | ----------------------------------- | -------------------------------------------------------- |
| pnpm 버전                   | 9.15.0으로 업그레이드 (기존 8.15.9) | engines `>=9` 요건 충족                                  |
| `"type": "module"`          | 루트 `package.json`에 추가          | CLAUDE.md ESM only 규칙 + commitlint ESM 경고 해소       |
| pre-commit typecheck        | **제거** (CI에서만 실행)            | 전체 워크스페이스 typecheck는 커밋마다 실행 시 너무 느림 |
| lint-staged ESLint          | Phase 0에서 **제외**                | @repo/config 없이 ESLint 설정 불가                       |
| `turbo.json` lint.dependsOn | `["^build"]` **유지**               | 유지 선택. Phase 4/5 이후 느리면 제거 검토               |

### Phase 1 진입 전 체크리스트

- [ ] `packages/config/package.json`에 `"type": "module"` 추가 (ESM 호환)
- [ ] Phase 1 완료 후 `lint-staged`에 `eslint --fix` 항목 추가 (루트 `package.json`)
- [ ] 루트 `tsconfig.json`의 `references` 배열에 `packages/config` 추가

---

## Phase 1 — 완료

**브랜치**: `feat/phase-1-config`  
**PR**: (오픈 예정)  
**상태**: 구현 완료, main 미머지

### 결정 사항

| 항목                                                 | 결정                                                                                              | 이유                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `typescript-eslint` 통합 패키지                      | `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` 대신 `typescript-eslint` v8 사용 | ESLint 9 flat config API 간결, 공식 권장                                     |
| `eslint-plugin-import-x`                             | `eslint-plugin-import` v2 대신 사용                                                               | v2는 ESLint 9 flat config 미지원, import-x는 네이티브 지원                   |
| `tseslint.config()` wrapper 미사용                   | plain array export (`export default [...]`)                                                       | v8.59.1에서 `tseslint.config()` 모든 overload가 deprecated Hint 발생         |
| `packages/config/tsconfig.json` 없음                 | TypeScript 소스 파일 없음 → tsconfig 불필요                                                       | `.js` + `.json`만 있어 TS 컴파일 불필요; `tsc --noEmit`은 TS18002/18003 에러 |
| `typecheck` 스크립트 없음                            | `packages/config/package.json`에 typecheck 미포함                                                 | 위와 동일 이유; turbo가 해당 패키지 skip                                     |
| `base.json`에서 `esModuleInterop` 제거               | `verbatimModuleSyntax: true`와 충돌, ESM-only에서 불필요                                          | 두 옵션이 상충; `verbatimModuleSyntax`이 우선                                |
| `library.json`에 `outDir: dist`, `rootDir: src` 추가 | 기본값 없으면 `.tsbuildinfo` + declaration이 src/ 오염                                            | composite 패키지는 빌드 산출물 위치 명시 필요                                |
| 루트 `tsconfig.json` references 갱신 생략            | packages/config에 TS composite 설정 없음                                                          | 소스 없는 패키지를 project reference로 등록하면 오류 가능                    |

### Phase 2/3 진입 전 체크리스트

- [ ] Phase 2 완료 후 `packages/api-client/tsconfig.json`에 `extends: "@repo/config/typescript/library"` 추가
- [ ] Phase 3 완료 후 `packages/ui/tsconfig.json`에 `extends: "@repo/config/typescript/library"` 추가
- [ ] 루트 `eslint.config.js` 필요 시 추가 (lint-staged의 `eslint --fix`가 루트 파일에 실행될 때)
