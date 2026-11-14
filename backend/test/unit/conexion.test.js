import test from 'node:test'
import assert from 'node:assert/strict'
import { opcionesPool, usaTLS } from '../../src/config/conexion.js'

test('sin DATABASE_URL usa las variables DB_* y no activa TLS', () => {
  const o = opcionesPool({ DB_HOST: 'h', DB_PORT: '5433', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'n' })
  assert.deepEqual(o, { host: 'h', port: 5433, user: 'u', password: 'p', database: 'n' })
})

test('DATABASE_URL con sslmode=require activa TLS verificado', () => {
  const url = 'postgresql://u:p@ep-x.neon.tech/db?sslmode=require'
  const o = opcionesPool({ DATABASE_URL: url })
  assert.equal(o.connectionString, url)
  assert.deepEqual(o.ssl, { rejectUnauthorized: true })
})

test('DATABASE_URL tiene prioridad sobre DB_*', () => {
  const o = opcionesPool({ DATABASE_URL: 'postgresql://u:p@h/db', DB_HOST: 'otro' })
  assert.equal(o.host, undefined)
  assert.equal(o.connectionString, 'postgresql://u:p@h/db')
})

test('DB_SSL fuerza o desactiva TLS', () => {
  assert.equal(usaTLS({ DB_SSL: 'true' }), true)
  assert.equal(usaTLS({ DB_SSL: 'false', DATABASE_URL: 'postgresql://x/db?sslmode=require' }), false)
  assert.equal(usaTLS({ DATABASE_URL: 'postgresql://x/db' }), false)
})
