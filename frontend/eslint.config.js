import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // react-hooks v7 marca el patrón "cargar datos al montar" (setState dentro de
      // useEffect), usado en varias pantallas. Se mantiene como aviso hasta extraer
      // la carga a un hook de datos; no justifica bloquear el CI.
      'react-hooks/set-state-in-effect': 'warn',
      // Solo afecta a la recarga en caliente (HMR) en desarrollo, no al producto.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
