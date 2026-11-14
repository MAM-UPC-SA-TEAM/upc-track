import { test, expect } from '@playwright/test'
import { iniciarSesion, unico, CLAVE_DEMO } from '../helpers.js'

test.describe('Administrador', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, 'admin')
  })

  test('el panel ofrece los tres accesos de gestión', async ({ page }) => {
    for (const nombre of ['Gestionar usuarios', 'Gestionar buses', 'Gestionar rutas']) {
      await expect(page.getByRole('link', { name: new RegExp(nombre) })).toBeVisible()
    }
  })

  test('gestión de usuarios: lista las cuentas del seed', async ({ page }) => {
    await page.getByRole('link', { name: /Gestionar usuarios/ }).click()
    await expect(page).toHaveURL(/\/admin\/usuarios$/)
    const tabla = page.getByRole('table', { name: 'Usuarios' })
    await expect(tabla.getByText('Conductor Demo')).toBeVisible()
    await expect(tabla.getByText('Estudiante Demo')).toBeVisible()
  })

  test('crea un usuario, aparece en la lista y luego lo elimina', async ({ page }) => {
    const usuario = unico('adm')
    const nombre = `Usuario ${usuario}`
    await page.goto('/admin/usuarios')

    await page.getByRole('button', { name: 'Agregar usuario' }).click()
    const dialogo = page.getByRole('dialog')
    await dialogo.getByLabel('Nombre completo').fill(nombre)
    await dialogo.getByLabel('Nombre de usuario').fill(usuario)
    await dialogo.getByLabel('Correo').fill(`${usuario}@unicesar.edu.co`)
    await dialogo.getByLabel('Contraseña', { exact: true }).fill(CLAVE_DEMO)
    await dialogo.getByLabel('Rol').selectOption('conductor')
    await dialogo.getByRole('button', { name: 'Guardar' }).click()

    const tabla = page.getByRole('table', { name: 'Usuarios' })
    await expect(tabla.getByText(nombre)).toBeVisible()

    await tabla.getByRole('button', { name: `Eliminar ${nombre}` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
    await expect(tabla.getByText(nombre)).toHaveCount(0)
  })

  test('gestión de usuarios: validar el formulario antes de guardar', async ({ page }) => {
    await page.goto('/admin/usuarios')
    await page.getByRole('button', { name: 'Agregar usuario' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('dialog').locator('.campo-error').first()).toBeVisible()
  })

  test('gestión de buses y de rutas cargan con los datos del seed', async ({ page }) => {
    await page.goto('/admin/buses')
    await expect(page.getByText('UPC-001').first()).toBeVisible()
    await page.goto('/admin/rutas')
    await expect(page.getByText('Centro - UPC').first()).toBeVisible()
  })
})
