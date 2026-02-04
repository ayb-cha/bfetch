import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  gitignore: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
})
