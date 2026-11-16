import { test, expect } from '@playwright/test'
import { iniciarSesion } from '../helpers.js'

test.describe('Estudiante', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, 'estudiante')
  })

  test('ve las rutas con sus paradas y horarios (datos reales de la BD)', async ({ page }) => {
    await page.goto('/rutas')
    const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Centro - UPC' }) })
    await expect(tarjeta).toBeVisible()
    await expect(tarjeta.getByText('2 paradas')).toBeVisible()
    await expect(tarjeta.getByText('06:30 – 07:00')).toBeVisible()
    await expect(tarjeta.getByRole('link', { name: /ver en el mapa/i })).toBeVisible()
  })

  test('navega de Rutas al mapa desde la tarjeta', async ({ page }) => {
    await page.goto('/rutas')
    await page.getByRole('link', { name: /ver en el mapa/i }).click()
    await expect(page).toHaveURL(/\/mapa\?ruta=1/)
  })

  test('sin buses transmitiendo, «Buses» lo dice y ofrece las rutas', async ({ page }) => {
    await page.goto('/buses')
    await expect(page.getByText('Sin bus ahora')).toBeVisible()
    await expect(page.getByRole('link', { name: /ver rutas y horarios/i })).toBeVisible()
  })
})
