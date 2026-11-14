// Antes de las pruebas: comprueba que la base es la de e2e (local y desechable) y
// le aplica el esquema y el seed de desarrollo (usuarios admin/conductor/estudiante, clave Admin123*).
import { execFileSync } from 'node:child_process'
import { BD_E2E } from '../playwright.config.js'

export default function globalSetup() {
  // Salvaguarda: este setup aplica un seed con claves públicas. Solo contra una base local.
  if (!['127.0.0.1', 'localhost'].includes(BD_E2E.DB_HOST)) {
    throw new Error(`e2e: la base debe ser local, no «${BD_E2E.DB_HOST}».`)
  }

  try {
    execFileSync(process.execPath, ['scripts/db/migrate.mjs', '--seed', 'seed.sql'], {
      cwd: 'backend',
      env: { ...process.env, ...BD_E2E },
      stdio: 'inherit',
    })
  } catch {
    throw new Error('e2e: no se pudo preparar la base. ¿Está levantada? Ejecuta «npm run e2e:db:up».')
  }
}
