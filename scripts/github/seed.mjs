#!/usr/bin/env node
// scripts/github/seed.mjs
// Crea labels, milestones e issues de la ruta de trabajo en GitHub usando `gh`.
//
//   node scripts/github/seed.mjs                  -> simulación (no toca GitHub)
//   node scripts/github/seed.mjs --apply          -> crea todo (idempotente)
//   node scripts/github/seed.mjs --apply --only W01,D05
//   node scripts/github/seed.mjs --repo OWNER/REPO --apply
//   node scripts/github/seed.mjs --table          -> tabla markdown del catálogo
//   node scripts/github/seed.mjs --dump           -> todos los issues renderizados en markdown
//
// Idempotencia: un issue ya existente se reconoce por el prefijo "[ID]" del título.

import { execFileSync } from 'node:child_process'
import { ISSUES, LABELS, MILESTONES } from './issues.mjs'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const APPLY = flag('--apply')
const only = opt('--only')?.split(',').map((s) => s.trim().toUpperCase())
const repoArg = opt('--repo')

const MILESTONE_BY_N = Object.fromEntries(MILESTONES.map((m) => [m.n, m]))
const tituloCompleto = (i) => `[${i.id}] ${i.titulo}`

function labelsDe(i) {
  const l = [`prio:P${i.prio.slice(1)}-${{ P0: 'must', P1: 'should', P2: 'could' }[i.prio]}`]
  for (const a of i.area ?? []) l.push(`area:${a}`)
  if (i.nivel) l.push(`nivel-${i.nivel}`)
  if (i.charter) l.push('charter')
  l.push(i.area?.includes('docs') && i.area.length === 1 ? 'documentation' : 'enhancement')
  return l
}

// numeros: Map(id -> #número) para resolver dependencias; si no existe aún, deja el ID.
function render(i, numeros = new Map()) {
  const ref = (id) => (numeros.has(id) ? `#${numeros.get(id)} (${id})` : id)
  const out = []
  out.push(`**Hito:** ${MILESTONE_BY_N[i.hito].title} · **Prioridad:** ${i.prio}`)
  out.push('')
  out.push('## Contexto', i.contexto, '')
  out.push('## Tareas', ...i.tareas.map((t) => `- [ ] ${t}`), '')
  out.push('## Criterios de aceptación', ...i.aceptacion.map((t) => `- [ ] ${t}`), '')
  if (i.deps?.length) out.push(`**Depende de:** ${i.deps.map(ref).join(', ')}`, '')
  out.push(`**Trazabilidad:** ${i.refs}`)
  return out.join('\n')
}

function validar() {
  const ids = new Set()
  for (const i of ISSUES) {
    if (ids.has(i.id)) throw new Error(`ID duplicado: ${i.id}`)
    ids.add(i.id)
    if (!MILESTONE_BY_N[i.hito]) throw new Error(`${i.id}: hito inválido`)
    if (!['P0', 'P1', 'P2'].includes(i.prio)) throw new Error(`${i.id}: prioridad inválida`)
    if (!i.tareas?.length || !i.aceptacion?.length) throw new Error(`${i.id}: faltan tareas o criterios`)
  }
  for (const i of ISSUES) {
    for (const d of i.deps ?? []) if (!ids.has(d)) throw new Error(`${i.id}: dependencia inexistente ${d}`)
  }
  const nombresLabel = new Set(LABELS.map((l) => l.name))
  const builtin = new Set(['enhancement', 'documentation'])
  for (const i of ISSUES) {
    for (const l of labelsDe(i)) {
      if (!nombresLabel.has(l) && !builtin.has(l)) throw new Error(`${i.id}: label no definido ${l}`)
    }
  }
}

function tabla() {
  const filas = ['| ID | Hito | Prio | Áreas | Depende de | Issue |', '|---|---|---|---|---|---|']
  for (const i of ISSUES) {
    filas.push(
      `| ${i.id} | H${i.hito} | ${i.prio} | ${(i.area ?? []).join(', ')} | ${(i.deps ?? []).join(', ') || '—'} | ${i.titulo} |`,
    )
  }
  return filas.join('\n')
}

function resumen() {
  const porHito = {}
  for (const i of ISSUES) {
    porHito[i.hito] ??= { P0: 0, P1: 0, P2: 0 }
    porHito[i.hito][i.prio]++
  }
  return porHito
}

// ───────────────────────── gh ─────────────────────────
function gh(ghArgs, input) {
  return execFileSync('gh', ghArgs, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}

function repoActual() {
  return repoArg ?? gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])
}

function aplicar() {
  const repo = repoActual()
  console.log(`Repositorio destino: ${repo}`)

  // 1) Labels
  for (const l of LABELS) {
    gh(['label', 'create', l.name, '--color', l.color, '--description', l.description, '--force', '--repo', repo])
  }
  console.log(`✔ ${LABELS.length} labels`)

  // 2) Milestones (por título)
  const existentes = JSON.parse(gh(['api', `repos/${repo}/milestones?state=all&per_page=100`]))
  const tituloMs = new Set(existentes.map((m) => m.title))
  for (const m of MILESTONES) {
    if (tituloMs.has(m.title)) continue
    gh([
      'api', `repos/${repo}/milestones`,
      '-f', `title=${m.title}`,
      '-f', `description=${m.description}`,
      '-f', `due_on=${m.due}T23:59:00Z`,
    ])
  }
  console.log(`✔ ${MILESTONES.length} hitos`)

  // 3) Issues
  const ya = JSON.parse(gh(['issue', 'list', '--repo', repo, '--state', 'all', '--limit', '1000', '--json', 'number,title']))
  const numeros = new Map()
  for (const e of ya) {
    const m = e.title.match(/^\[([A-Z]\d{2})\]/)
    if (m) numeros.set(m[1], e.number)
  }

  const seleccion = ISSUES.filter((i) => !only || only.includes(i.id))
  const creados = []
  for (const i of seleccion) {
    if (numeros.has(i.id)) {
      console.log(`= ${i.id} ya existe (#${numeros.get(i.id)})`)
      continue
    }
    const cmd = [
      'issue', 'create', '--repo', repo,
      '--title', tituloCompleto(i),
      '--body-file', '-',
      '--milestone', MILESTONE_BY_N[i.hito].title,
    ]
    for (const l of labelsDe(i)) cmd.push('--label', l)
    const url = gh(cmd, render(i, numeros))
    const n = Number(url.split('/').pop())
    numeros.set(i.id, n)
    creados.push(i)
    console.log(`+ ${i.id} -> #${n}`)
  }

  // 4) Segunda pasada: resolver dependencias que apuntaban a issues creados después
  for (const i of creados) {
    gh(['issue', 'edit', String(numeros.get(i.id)), '--repo', repo, '--body-file', '-'], render(i, numeros))
  }
  console.log(`✔ ${creados.length} issues creados`)
}

// ───────────────────────── main ─────────────────────────
validar()

if (flag('--table')) {
  console.log(tabla())
} else if (flag('--dump')) {
  for (const i of ISSUES) console.log(`# ${tituloCompleto(i)}\n_Labels: ${labelsDe(i).join(', ')}_\n\n${render(i)}\n\n---\n`)
} else if (APPLY) {
  aplicar()
} else {
  const r = resumen()
  console.log('SIMULACIÓN — no se modificó nada en GitHub. Usa --apply para ejecutar.\n')
  console.log(`${LABELS.length} labels · ${MILESTONES.length} hitos · ${ISSUES.length} issues\n`)
  for (const m of MILESTONES) {
    const x = r[m.n] ?? { P0: 0, P1: 0, P2: 0 }
    console.log(`${m.title} (vence ${m.due}): ${x.P0} Must · ${x.P1} Should · ${x.P2} Could`)
    for (const i of ISSUES.filter((i) => i.hito === m.n)) {
      console.log(`   ${i.prio}  ${tituloCompleto(i)}  [${labelsDe(i).join(' ')}]`)
    }
  }
}
