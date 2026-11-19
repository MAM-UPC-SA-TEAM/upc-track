// Cálculo de las métricas de usabilidad (Q03): scripts/dev/usabilidad-resultados.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leerCsv, sus, analizar, informe } from '../../../scripts/dev/usabilidad-resultados.mjs'

const susTodo = (impar, par) => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus${i + 1}`, String((i + 1) % 2 ? impar : par)]))

test('SUS: respuestas ideales (5 en impares, 1 en pares) dan 100; todo 3 da 50; lo peor da 0', () => {
  assert.equal(sus(susTodo(5, 1)), 100)
  assert.equal(sus(susTodo(3, 3)), 50)
  assert.equal(sus(susTodo(1, 5)), 0)
})

test('SUS: una respuesta ausente o fuera de 1 a 5 no cuenta (null, no un número inventado)', () => {
  assert.equal(sus({ ...susTodo(5, 1), sus4: '' }), null)
  assert.equal(sus({ ...susTodo(5, 1), sus4: '7' }), null)
})

test('leerCsv: una fila por participante, con el encabezado como claves', () => {
  const filas = leerCsv('id,rol,satisfaccion\r\nE01,estudiante,5\r\nC01,conductor,4\r\n')
  assert.deepEqual(filas, [{ id: 'E01', rol: 'estudiante', satisfaccion: '5' }, { id: 'C01', rol: 'conductor', satisfaccion: '4' }])
})

function estudiante(id, { sat = '5', baseSeg = '120', t3Seg = '20', t3Ok = '1', espH = '10', espA = '5' } = {}) {
  return { id, rol: 'estudiante', t1_ok: '1', t1_seg: '10', t2_ok: '1', t2_seg: '15', t3_ok: t3Ok, t3_seg: t3Seg, t4_ok: '1', t4_seg: '12', t5_ok: '1', t5_seg: '8', ...susTodo(5, 1), satisfaccion: sat, base_consulta_seg: baseSeg, espera_habitual_min: espH, espera_con_app_min: espA }
}
const conductor = (id) => ({ id, rol: 'conductor', t1_ok: '1', t1_seg: '9', t2_ok: '1', t2_seg: '14', t3_ok: '1', t3_seg: '30', t4_ok: '1', t4_seg: '6', ...susTodo(4, 2), satisfaccion: '4' })

test('analizar: con la muestra del plan y buenos resultados, todas las metas se cumplen', () => {
  const filas = [...Array.from({ length: 8 }, (_, i) => estudiante(`E0${i + 1}`)), conductor('C01'), conductor('C02')]
  const r = analizar(filas)
  assert.deepEqual(r.n, { estudiantes: 8, conductores: 2, total: 10 })
  assert.equal(r.satisfaccion.pct45, 1)
  assert.equal(r.consulta.razon, 20 / 120)
  assert.equal(r.espera.razon, 0.5)
  assert.deepEqual(r.metas, { muestra: true, satisfaccion: true, sus: true, exito: true, consulta: true, espera: true })
})

test('analizar: la satisfacción es el porcentaje que puntúa 4 o 5, y 79 % no llega al 80 %', () => {
  // 3 de 4 con 4 o 5 = 75 %: no cumple
  const filas = [estudiante('E01'), estudiante('E02'), estudiante('E03', { sat: '4' }), estudiante('E04', { sat: '2' })]
  const r = analizar(filas)
  assert.equal(r.satisfaccion.pct45, 0.75)
  assert.equal(r.metas.satisfaccion, false)
  assert.equal(r.metas.muestra, false) // 4 estudiantes y 0 conductores: menos que el plan
})

test('analizar: el tiempo de consulta solo cuenta las tareas T3 completadas sin ayuda', () => {
  const filas = [estudiante('E01', { t3Ok: '0', t3Seg: '999' }), estudiante('E02', { t3Seg: '30', baseSeg: '60' })]
  const r = analizar(filas)
  assert.equal(r.consulta.n, 1)
  assert.equal(r.consulta.razon, 0.5)
  assert.equal(r.metas.consulta, true) // justo en el límite: ≤ 50 %
  assert.equal(r.tareasEstudiante.t3.exito, 0.5)
  assert.equal(r.metas.exito, false) // T3 tiene 50 % de éxito
})

test('analizar: sin datos de una meta, no se declara cumplida ni incumplida (null)', () => {
  const r = analizar([conductor('C01')])
  assert.equal(r.metas.consulta, null)
  assert.equal(r.metas.espera, null)
})

test('informe: es un Markdown que enuncia cada meta con SÍ/NO', () => {
  const texto = informe(analizar([...Array.from({ length: 8 }, (_, i) => estudiante(`E0${i + 1}`)), conductor('C01'), conductor('C02')]))
  assert.match(texto, /# Resultados de las pruebas de usabilidad/)
  assert.match(texto, /Satisfacción ≥ 80 %.*\| SÍ \|/)
  assert.match(texto, /Tiempo de consulta −50 %.*83 % menos/)
})
