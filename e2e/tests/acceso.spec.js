import { test, expect } from '@playwright/test'
import { iniciarSesion, unico, CLAVE_DEMO } from '../helpers.js'

test.describe('Acceso', () => {
  test('sin sesión, una ruta protegida redirige al login', async ({ page }) => {
    await page.goto('/rutas')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })

  test('el login valida los campos vacíos', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Escribe tu nombre de usuario.')).toBeVisible()
  })

  test('con una contraseña incorrecta muestra el error y no entra', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario').fill('estudiante')
    await page.getByLabel('Contraseña', { exact: true }).fill('clave-equivocada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos')
    await expect(page).toHaveURL(/\/login$/)
  })

  for (const rol of ['estudiante', 'conductor', 'admin']) {
    test(`login de ${rol} llega a su pantalla`, async ({ page }) => {
      await iniciarSesion(page, rol)
    })
  }

  test('un estudiante no puede entrar al panel de administración', async ({ page }) => {
    await iniciarSesion(page, 'estudiante')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('cerrar sesión devuelve al login y la sesión no sobrevive a recargar', async ({ page }) => {
    await iniciarSesion(page, 'estudiante')
    await page.getByRole('button', { name: /cerrar sesión/i }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/rutas')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('la sesión persiste al recargar la página', async ({ page }) => {
    await iniciarSesion(page, 'estudiante')
    await page.goto('/rutas')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Rutas disponibles' })).toBeVisible()
  })

  test('un estudiante nuevo se registra y queda con la sesión iniciada', async ({ page }) => {
    const usuario = unico('e2e')
    await page.goto('/registro')
    await page.getByLabel('Nombre completo').fill('Persona de Prueba')
    await page.getByLabel('Nombre de usuario').fill(usuario)
    await page.getByLabel('Correo electrónico').fill(`${usuario}@unicesar.edu.co`)
    await page.getByLabel('Contraseña', { exact: true }).fill(CLAVE_DEMO)
    await page.getByLabel('Confirmar contraseña').fill(CLAVE_DEMO)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page).toHaveURL(/\/inicio$/)

    // y puede volver a entrar con esa cuenta
    await page.getByRole('button', { name: /cerrar sesión/i }).click()
    await page.getByLabel('Usuario').fill(usuario)
    await page.getByLabel('Contraseña', { exact: true }).fill(CLAVE_DEMO)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/inicio$/)
  })

  test('registrar un usuario ya existente muestra el error', async ({ page }) => {
    await page.goto('/registro')
    await page.getByLabel('Nombre completo').fill('Otro Estudiante')
    await page.getByLabel('Nombre de usuario').fill('estudiante')
    await page.getByLabel('Correo electrónico').fill(`${unico('x')}@unicesar.edu.co`)
    await page.getByLabel('Contraseña', { exact: true }).fill(CLAVE_DEMO)
    await page.getByLabel('Confirmar contraseña').fill(CLAVE_DEMO)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('alert')).toContainText('nombre de usuario ya está en uso')
  })
})
