import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuración de pruebas separada de vite.config.js (que exige VITE_API_URL en modo nativo).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.{js,jsx}'],
    css: false,
    // Las pruebas no dependen del .env.local de cada máquina: sin URL base, api.js usa rutas relativas.
    env: { VITE_API_URL: '' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/assets/**'],
      // El CI falla si la cobertura baja de 60 % (requisito del curso de Testing).
      thresholds: { statements: 60, branches: 60, functions: 60, lines: 60 },
    },
  },
})
