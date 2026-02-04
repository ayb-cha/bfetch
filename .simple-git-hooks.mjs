export default {
  'pre-commit': 'pnpm lint-staged',
  // eslint-disable-next-line no-template-curly-in-string
  'commit-msg': 'pnpm commitlint --edit ${1}',
}
