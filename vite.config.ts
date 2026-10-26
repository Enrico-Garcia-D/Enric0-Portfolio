import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works on GitHub Pages project sites and custom domains alike.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 3000, strictPort: true },
})
