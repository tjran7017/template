/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'style'],
    ],
    'scope-enum': [
      2,
      'always',
      ['nextjs', 'react-vite', 'ui', 'api-client', 'config', 'repo'],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [0],
  },
};
