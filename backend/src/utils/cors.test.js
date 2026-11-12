// Pruebas de la política de orígenes (utils/cors.js).
// env.js lee y valida process.env al importarse, así que se fija antes del import dinámico.
import { test } from 'node:test'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  JWT_SECRET: 'test',
  JWT_EXPIRES_IN: '1h',
  CLIENT_URL: 'http://localhost:5173, https://upctrack.vercel.app/',
})

const { origenPermitido, corsOptions, socketCorsOptions } = await import('./cors.js')

function en(entorno, fn) {
  const previo = process.env.NODE_ENV
  process.env.NODE_ENV = entorno
  try {
    return fn()
  } finally {
    if (previo === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previo
  }
}

for (const entorno of ['production', 'development']) {
  test(`[${entorno}] permite sin Origin (Postman/curl)`, () => {
    en(entorno, () => assert.equal(origenPermitido(undefined), true))
  })

  test(`[${entorno}] permite los orígenes de CLIENT_URL, con o sin barra final`, () => {
    en(entorno, () => {
      assert.equal(origenPermitido('http://localhost:5173'), true)
      assert.equal(origenPermitido('https://upctrack.vercel.app'), true)
      assert.equal(origenPermitido('https://upctrack.vercel.app/'), true)
    })
  })

  test(`[${entorno}] permite los orígenes de la app nativa (Capacitor)`, () => {
    en(entorno, () => {
      assert.equal(origenPermitido('https://localhost'), true)
      assert.equal(origenPermitido('capacitor://localhost'), true)
    })
  })

  test(`[${entorno}] rechaza orígenes desconocidos y mal formados`, () => {
    en(entorno, () => {
      assert.equal(origenPermitido('https://evil.example'), false)
      assert.equal(origenPermitido('https://upctrack.vercel.app.evil.example'), false)
      assert.equal(origenPermitido('no es una url'), false)
    })
  })
}

test('[production] rechaza LAN, ngrok y http://localhost sin puerto', () => {
  en('production', () => {
    assert.equal(origenPermitido('http://192.168.1.7:5173'), false)
    assert.equal(origenPermitido('http://10.0.0.5:5173'), false)
    assert.equal(origenPermitido('https://abc.ngrok-free.dev'), false)
    assert.equal(origenPermitido('http://localhost'), false)
    assert.equal(origenPermitido('http://localhost:4000'), false)
  })
})

test('[development] permite LAN y ngrok para probar desde el celular', () => {
  en('development', () => {
    assert.equal(origenPermitido('http://192.168.1.7:5173'), true)
    assert.equal(origenPermitido('http://172.20.0.3:5173'), true)
    assert.equal(origenPermitido('https://abc.ngrok-free.dev'), true)
    assert.equal(origenPermitido('http://localhost:4000'), true)
  })
})

test('corsOptions y socketCorsOptions comparten política y distinguen el mensaje de error', () => {
  en('production', () => {
    let resultado
    corsOptions.origin('https://evil.example', (err, ok) => (resultado = { err, ok }))
    assert.match(resultado.err.message, /Origin no permitido por CORS: https:\/\/evil\.example/)

    socketCorsOptions.origin('https://evil.example', (err, ok) => (resultado = { err, ok }))
    assert.match(resultado.err.message, /Origin no permitido por Socket CORS/)

    socketCorsOptions.origin('capacitor://localhost', (err, ok) => (resultado = { err, ok }))
    assert.equal(resultado.err, null)
    assert.equal(resultado.ok, true)
    assert.equal(corsOptions.credentials, true)
    assert.equal(socketCorsOptions.credentials, true)
  })
})
