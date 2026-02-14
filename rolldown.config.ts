import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

export default defineConfig({
  input: 'src/index.js',
  plugins: [dts()],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  resolve: {
    alias: {
      '@/': './src',
    },
  },
})
