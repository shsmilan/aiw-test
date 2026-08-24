import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // Use repo base path only for production build artifacts deployed to GitHub Pages.
  base: command === 'build' ? '/aiw-test/' : '/',
  plugins: [react()],
}))
