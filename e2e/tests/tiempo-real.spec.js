// Flujo de extremo a extremo con DOS personas a la vez: el conductor transmite su ubicación (GPS simulado)
// y el estudiante lo ve en «Buses», y luego deja de verlo en vivo cuando el conductor finaliza (Socket.IO).
import { test, expect } from '@playwright/test'
import { iniciarSesion } from '../helpers.js'

test('el conductor inicia un recorrido y el estudiante ve el bus; al finalizar, desaparece en vivo', async ({ browser }) => {
  const contextoConductor = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { latitude: 8.311, longitude: -73.615 },
  })
  const contextoEstudiante = await browser.newContext()
  const conductor = await contextoConductor.newPage()
  const estudiante = await contextoEstudiante.newPage()

  try {
    // 1) El conductor inicia el recorrido
    await iniciarSesion(conductor, 'conductor')
    await conductor.getByRole('button', { name: /iniciar recorrido/i }).click()
    await expect(conductor.getByRole('button', { name: /finalizar/i })).toBeVisible()

    // 2) El estudiante lo ve en la lista de buses (la posición llega al servidor cada pocos segundos)
    await iniciarSesion(estudiante, 'estudiante')
    await estudiante.goto('/buses')
    await expect(async () => {
      await estudiante.reload()
      await expect(estudiante.getByRole('heading', { name: '1 bus en ruta' })).toBeVisible({ timeout: 3000 })
    }).toPass({ timeout: 30_000 })
    await expect(estudiante.getByText('Bus 1')).toBeVisible()
    await expect(estudiante.getByText(/Validado · \d+ s|Hace/)).toBeVisible()

    // 3) El conductor finaliza (pide un segundo toque) y el bus se va SIN recargar la página del estudiante
    await conductor.getByRole('button', { name: /finalizar/i }).click()
    await conductor.getByRole('button', { name: /toca otra vez para finalizar/i }).click()
    await expect(estudiante.getByText('Sin bus ahora')).toBeVisible({ timeout: 15_000 })
  } finally {
    await contextoConductor.close()
    await contextoEstudiante.close()
  }
})
