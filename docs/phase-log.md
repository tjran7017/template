# Phase 구현 로그

코드나 계획서에서 바로 알 수 없는 **결정 사항과 인수인계 메모**만 기록.

---

## Phase 0 — 완료

**PR**: [#2](https://github.com/tjran7017/template/pull/2) (`feat/phase-0-monorepo-skeleton`)  
**상태**: PR 오픈, main 미머지

### 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| pnpm 버전 | 9.15.0으로 업그레이드 (기존 8.15.9) | engines `>=9` 요건 충족 |
| `"type": "module"` | 루트 `package.json`에 추가 | CLAUDE.md ESM only 규칙 + commitlint ESM 경고 해소 |
| pre-commit typecheck | **제거** (CI에서만 실행) | 전체 워크스페이스 typecheck는 커밋마다 실행 시 너무 느림 |
| lint-staged ESLint | Phase 0에서 **제외** | @repo/config 없이 ESLint 설정 불가 |
| `turbo.json` lint.dependsOn | `["^build"]` **유지** | 유지 선택. Phase 4/5 이후 느리면 제거 검토 |

### Phase 1 진입 전 체크리스트

- [ ] `packages/config/package.json`에 `"type": "module"` 추가 (ESM 호환)
- [ ] Phase 1 완료 후 `lint-staged`에 `eslint --fix` 항목 추가 (루트 `package.json`)
- [ ] 루트 `tsconfig.json`의 `references` 배열에 `packages/config` 추가

---

## Phase 1 — 진행 예정

**브랜치**: `feat/phase-1-config`  
**산출물**: `packages/config/` — tsconfig 4종, eslint 5종, prettier 1종  
**참고**: `docs/agent-plan.md` Phase 1 섹션
