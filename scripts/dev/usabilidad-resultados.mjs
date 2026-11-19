// scripts/dev/usabilidad-resultados.mjs
// Calcula las métricas de las pruebas de usabilidad (Q03) y las compara con las metas del charter v2.
//
//   node scripts/dev/usabilidad-resultados.mjs docs/usabilidad/resultados.csv
//
// El CSV tiene una fila por participante (ver docs/15_pruebas_usabilidad.md, sección 7). Sin dependencias.

import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const MIN_ESTUDIANTES = 8
const MIN_CONDUCTORES = 2
const META_SATISFACCION = 0.8 // ≥ 80 % puntúa 4 o 5
const META_SUS = 68
const META_EXITO = 0.8
const META_CONSULTA = 0.5 // la mediana con la app debe ser ≤ 50 % de la habitual
const META_ESPERA = 0.7 // la espera con la app debe ser ≤ 70 % de la habitual (−30 %)
const TAREA_CONSULTA = 't3' // «cuánto falta para que llegue el bus a la parada»

export function leerCsv(texto) {
  const [cab, ...filas] = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  const cols = cab.split(',').map((c) => c.trim())
  return filas.map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v.trim()])))
}

const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))
const mediana = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const pct = (x) => (x === null ? 'n/d' : `${(x * 100).toFixed(0)} %`)
const f1 = (x) => (x === null ? 'n/d' : x.toFixed(1))

/** SUS de una fila: impares (r − 1), pares (5 − r), suma × 2,5. null si faltan respuestas o están fuera de 1 a 5. */
export function sus(fila) {
  let suma = 0
  for (let i = 1; i <= 10; i++) {
    const r = num(fila[`sus${i}`])
    if (r === null || r < 1 || r > 5) return null
    suma += i % 2 ? r - 1 : 5 - r
  }
  return suma * 2.5
}

export function analizar(filas) {
  const estudiantes = filas.filter((f) => f.rol === 'estudiante')
  const conductores = filas.filter((f) => f.rol === 'conductor')
  const res = { n: { estudiantes: estudiantes.length, conductores: conductores.length, total: filas.length } }

  const tareas = (grupo, ids) => Object.fromEntries(ids.map((t) => {
    const con = grupo.filter((f) => num(f[`${t}_ok`]) !== null)
    const ok = con.filter((f) => num(f[`${t}_ok`]) === 1)
    return [t, {
      n: con.length,
      exito: con.length ? ok.length / con.length : null,
      medianaSeg: mediana(ok.map((f) => num(f[`${t}_seg`])).filter((x) => x !== null)),
    }]
  }))
  res.tareasEstudiante = tareas(estudiantes, ['t1', 't2', 't3', 't4', 't5'])
  res.tareasConductor = tareas(conductores, ['t1', 't2', 't3', 't4'])

  const susPuntos = filas.map(sus).filter((x) => x !== null)
  res.sus = { n: susPuntos.length, media: media(susPuntos) }

  const sat = filas.map((f) => num(f.satisfaccion)).filter((x) => x !== null)
  res.satisfaccion = { n: sat.length, pct45: sat.length ? sat.filter((s) => s >= 4).length / sat.length : null, media: media(sat) }

  const pares = estudiantes
    .map((f) => ({ base: num(f.base_consulta_seg), app: num(f[`${TAREA_CONSULTA}_seg`]), ok: num(f[`${TAREA_CONSULTA}_ok`]) === 1 }))
    .filter((p) => p.base !== null && p.app !== null && p.ok)
  const mBase = mediana(pares.map((p) => p.base))
  const mApp = mediana(pares.map((p) => p.app))
  res.consulta = { n: pares.length, medianaBaseSeg: mBase, medianaAppSeg: mApp, razon: mBase ? mApp / mBase : null }

  const espera = estudiantes
    .map((f) => ({ h: num(f.espera_habitual_min), a: num(f.espera_con_app_min) }))
    .filter((p) => p.h !== null && p.a !== null)
  const mH = mediana(espera.map((p) => p.h))
  const mA = mediana(espera.map((p) => p.a))
  res.espera = { n: espera.length, medianaHabitualMin: mH, medianaConAppMin: mA, razon: mH ? mA / mH : null }

  const exitos = [...Object.values(res.tareasEstudiante), ...Object.values(res.tareasConductor)].map((t) => t.exito).filter((x) => x !== null)
  res.metas = {
    muestra: estudiantes.length >= MIN_ESTUDIANTES && conductores.length >= MIN_CONDUCTORES,
    satisfaccion: res.satisfaccion.pct45 === null ? null : res.satisfaccion.pct45 >= META_SATISFACCION,
    sus: res.sus.media === null ? null : res.sus.media >= META_SUS,
    exito: exitos.length ? exitos.every((x) => x >= META_EXITO) : null,
    consulta: res.consulta.razon === null ? null : res.consulta.razon <= META_CONSULTA,
    espera: res.espera.razon === null ? null : res.espera.razon <= META_ESPERA,
  }
  return res
}

const marca = (v) => (v === null ? 'sin datos' : v ? 'SÍ' : 'NO')

export function informe(r) {
  const L = []
  L.push('# Resultados de las pruebas de usabilidad', '')
  L.push(`Participantes: ${r.n.total} (${r.n.estudiantes} estudiantes, ${r.n.conductores} conductores). Muestra mínima del plan (${MIN_ESTUDIANTES} + ${MIN_CONDUCTORES}): ${marca(r.metas.muestra)}.`, '')
  const tabla = (titulo, t) => {
    L.push(`## ${titulo}`, '', '| Tarea | n | Éxito sin ayuda | Mediana (s) |', '|---|---|---|---|')
    for (const [id, v] of Object.entries(t)) L.push(`| ${id.toUpperCase()} | ${v.n} | ${pct(v.exito)} | ${f1(v.medianaSeg)} |`)
    L.push('')
  }
  tabla('Tareas de estudiantes', r.tareasEstudiante)
  tabla('Tareas de conductores', r.tareasConductor)
  L.push('## Contra las metas del charter', '', '| Meta | Resultado | ¿Se cumple? |', '|---|---|---|')
  L.push(`| Satisfacción ≥ 80 % (4 o 5 sobre 5) | ${pct(r.satisfaccion.pct45)} de ${r.satisfaccion.n} (media ${f1(r.satisfaccion.media)}) | ${marca(r.metas.satisfaccion)} |`)
  L.push(`| SUS ≥ ${META_SUS} | media ${f1(r.sus.media)} (n = ${r.sus.n}) | ${marca(r.metas.sus)} |`)
  L.push(`| Éxito ≥ 80 % en cada tarea | mínimo ${pct(Math.min(...[...Object.values(r.tareasEstudiante), ...Object.values(r.tareasConductor)].map((t) => t.exito).filter((x) => x !== null)))} | ${marca(r.metas.exito)} |`)
  L.push(`| Tiempo de consulta −50 % | mediana ${f1(r.consulta.medianaAppSeg)} s con la app frente a ${f1(r.consulta.medianaBaseSeg)} s habitual (${r.consulta.razon === null ? 'n/d' : `${((1 - r.consulta.razon) * 100).toFixed(0)} % menos`}, n = ${r.consulta.n}) | ${marca(r.metas.consulta)} |`)
  L.push(`| Espera innecesaria −30 % (declarada) | mediana ${f1(r.espera.medianaConAppMin)} min frente a ${f1(r.espera.medianaHabitualMin)} min (${r.espera.razon === null ? 'n/d' : `${((1 - r.espera.razon) * 100).toFixed(0)} % menos`}, n = ${r.espera.n}) | ${marca(r.metas.espera)} |`)
  L.push('', 'Si alguna meta da «NO» o «sin datos», el informe debe explicar por qué y qué se hará (criterio de aceptación de #42).')
  return L.join('\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const archivo = process.argv[2]
  if (!archivo || !fs.existsSync(archivo)) {
    console.error('Uso: node scripts/dev/usabilidad-resultados.mjs <resultados.csv>')
    process.exit(1)
  }
  const filas = leerCsv(fs.readFileSync(archivo, 'utf8'))
  if (!filas.length) { console.error('El CSV no tiene participantes.'); process.exit(1) }
  console.log(informe(analizar(filas)))
}
