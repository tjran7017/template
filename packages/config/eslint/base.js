import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import-x'
import prettierConfig from 'eslint-config-prettier'

// 사용처(루트 eslint.config.js)에서 zone rule을 같은 config object에 등록할 수 있도록 re-export
export { importPlugin }

export default [
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // tsconfig 밖의 JS 설정 파일(eslint.config.js 등)도 type-aware 규칙 적용 가능하게
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@repo/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-cycle': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  prettierConfig,
]
