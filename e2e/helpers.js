import { expect } from '@playwright/test'

// Usuarios del seed de desarrollo (database/seed.sql). Clave pública de demo.
export const CLAVE_DEMO = 'Admin123*'
export const USUARIOS = {
  admin: { usuario: 'admin', ruta: '/admin' },
  conductor: { usuario: 'conductor', ruta: '/conductor' },
  estudiante: { usuario: 'estudiante', ruta: '/inicio' },
}

// Inicia sesión por la interfaz, como lo haría una persona.
export async function iniciarSesion(page, rol) {
  const { usuario, ruta } = USUARIOS[rol]
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Contraseña', { exact: true }).fill(CLAVE_DEMO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(new RegExp(`${ruta}$`))
}

// Nombre único por ejecución para no chocar con datos de corridas anteriores.
export const unico = (prefijo) => `${prefijo}${Date.now().toString(36)}`
