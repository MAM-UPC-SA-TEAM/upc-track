// scripts/dev/auditoria-movil.mjs
// Recorre las pantallas de los 3 roles a 390 px (viewport movil con tactil), mide objetivos
// tactiles, desbordes, contraste estimado, etiquetas y tipografia, y guarda capturas JPEG.
// Es la evidencia de docs/13_auditoria_diseno.md; sirve para repetir la auditoria tras los arreglos.
//
// Requisitos: backend en :3000 con la BD de desarrollo (usuarios demo), frontend en :5173 y
// playwright-core (no es dependencia del repo: instalalo en una carpeta temporal).
//   mkdir -p /tmp/aud/shots && cd /tmp/aud && npm i playwright-core
//   node <repo>/scripts/dev/auditoria-movil.mjs /tmp/aud <ruta-a-chrome-o-headless-shell>
// Para un mapa con datos, pon un bus "en_recorrido" con una posicion antes de correrlo y
// revierte ese estado despues. Salida: <carpeta>/audit-medidas.json y <carpeta>/shots/*.jpg
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const S = process.argv[2]
const exe = process.argv[3]
const BASE = 'http://localhost:5173'
const API = 'http://localhost:3000'

const login = async (u) => (await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre_usuario: u, password: 'Admin123*' }) })).json()

// Todo corre dentro de la página. Mide lo verificable; no juzga diseño.
const medir = () => {
  const out = {}
  const de = document.documentElement
  out.overflowX = de.scrollWidth - de.clientWidth
  out.scrollHeight = de.scrollHeight
  out.h1 = document.querySelectorAll('h1').length
  out.landmarks = { main: !!document.querySelector('main'), nav: !!document.querySelector('nav'), header: !!document.querySelector('header') }
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' }
  const name = (el) => (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || ''
  const desc = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`

  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=link]'
  const inter = [...document.querySelectorAll(sel)].filter(vis)
  out.interactivos = inter.length
  out.pequenos44 = []
  out.pequenos24 = 0
  for (const el of inter) {
    const r = el.getBoundingClientRect()
    if (r.width < 44 || r.height < 44) out.pequenos44.push({ el: desc(el), txt: (name(el) || el.title || el.placeholder || '').slice(0, 22), w: Math.round(r.width), h: Math.round(r.height) })
    if (r.width < 24 || r.height < 24) out.pequenos24++
  }
  out.sinNombre = inter.filter((e) => ['BUTTON', 'A'].includes(e.tagName) && !name(e)).map((e) => ({ el: desc(e), titulo: e.title || null }))
  out.inputsSinEtiqueta = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).filter((i) => {
    const hasFor = i.id && document.querySelector(`label[for="${CSS.escape(i.id)}"]`)
    return !(hasFor || i.closest('label') || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'))
  }).map((i) => ({ el: desc(i), placeholder: i.placeholder || null }))
  out.imgSinAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length
  out.divClicables = [...document.querySelectorAll('div[onclick],span[onclick]')].length

  // Tipografía
  const textos = [...document.querySelectorAll('body *')].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
  const tam = textos.map((el) => parseFloat(getComputedStyle(el).fontSize))
  out.textoMin = Math.min(...tam)
  out.texto_lt12 = textos.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => `${desc(el)}:${getComputedStyle(el).fontSize}`).slice(0, 8)
  out.inputs_lt16 = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(vis).filter((i) => parseFloat(getComputedStyle(i).fontSize) < 16).length

  // Contraste estimado (texto sobre fondo plano; omite imágenes/gradientes/mapa)
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgDe = (el) => { let n = el; const capas = []; while (n && n.nodeType === 1) { const cs = getComputedStyle(n); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { capas.push(c); if (c.a >= 1) break } n = n.parentElement } let base = { r: 255, g: 255, b: 255 }; for (const c of capas.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }; return base }
  const fallos = {}
  let evaluados = 0
  for (const el of textos) {
    if (el.closest('.leaflet-container')) continue
    const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = bgDe(el); if (!fg || !bg) continue
    const op = parseFloat(cs.opacity); const a = fg.a * (isNaN(op) ? 1 : op)
    const f = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) }
    const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const px = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const grande = px >= 24 || (px >= 18.66 && bold)
    evaluados++
    if (ratio < (grande ? 3 : 4.5)) { const k = `${cs.color}|${getComputedStyle(el).backgroundColor}|${ratio.toFixed(2)}`; fallos[k] ??= { ratio: +ratio.toFixed(2), n: 0, ej: (el.innerText || '').trim().slice(0, 28), px } ; fallos[k].n++ }
  }
  out.contrasteEvaluados = evaluados
  out.contrasteFallos = Object.values(fallos).sort((a, b) => b.n - a.n).slice(0, 6)

  // Safe areas y viewport
  out.viewportMeta = document.querySelector('meta[name=viewport]')?.content
  return out
}

const paginas = [
  { rol: null, ruta: '/', nombre: 'landing' },
  { rol: null, ruta: '/login', nombre: 'login' },
  { rol: null, ruta: '/registro', nombre: 'registro' },
  { rol: 'estudiante', ruta: '/inicio', nombre: 'est-inicio' },
  { rol: 'estudiante', ruta: '/mapa', nombre: 'est-mapa' },
  { rol: 'estudiante', ruta: '/rutas', nombre: 'est-rutas' },
  { rol: 'estudiante', ruta: '/buses', nombre: 'est-buses' },
  { rol: 'estudiante', ruta: '/notificaciones', nombre: 'est-notificaciones' },
  { rol: 'estudiante', ruta: '/perfil', nombre: 'est-perfil' },
  { rol: 'conductor', ruta: '/conductor', nombre: 'cond-recorrido' },
  { rol: 'admin', ruta: '/admin', nombre: 'adm-panel' },
  { rol: 'admin', ruta: '/admin/usuarios', nombre: 'adm-usuarios' },
  { rol: 'admin', ruta: '/admin/buses', nombre: 'adm-buses' },
  { rol: 'admin', ruta: '/admin/rutas', nombre: 'adm-rutas' },
]
const oscuras = new Set(['login', 'est-inicio', 'est-mapa', 'cond-recorrido'])

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'] })
const sesiones = {}
for (const r of ['estudiante', 'conductor', 'admin']) sesiones[r] = await login(r)

const resultados = []
async function capturar(p, tema) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['geolocation'], geolocation: { latitude: 8.3135, longitude: -73.612 }, locale: 'es-CO' })
  const s = p.rol ? sesiones[p.rol] : null
  await ctx.addInitScript(([s, tema]) => { try { if (s) { localStorage.setItem('token', s.token); localStorage.setItem('usuario', JSON.stringify(s.usuario)) } localStorage.setItem('tema', tema) } catch {} }, [s, tema])
  const page = await ctx.newPage()
  const consola = [], fallidas = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consola.push(`${m.type()}: ${m.text().slice(0, 140)}`) })
  page.on('requestfailed', (r) => fallidas.push(`${r.method()} ${r.url().replace(BASE, '')} ${r.failure()?.errorText}`))
  await page.goto(BASE + p.ruta, { waitUntil: 'load' })
  await page.waitForTimeout(p.nombre === 'est-mapa' || p.nombre === 'cond-recorrido' ? 3500 : 1800)
  const m = await page.evaluate(medir)
  const archivo = `${p.nombre}${tema === 'oscuro' ? '-oscuro' : ''}.jpg`
  await page.screenshot({ path: `${S}/shots/${archivo}`, type: 'jpeg', quality: 70 })
  m.urlFinal = page.url().replace(BASE, '')
  m.consola = [...new Set(consola)].slice(0, 5); m.fallidas = [...new Set(fallidas)].slice(0, 5)
  resultados.push({ nombre: p.nombre, tema, ruta: p.ruta, ...m })
  await ctx.close()
}
for (const p of paginas) {
  await capturar(p, 'claro')
  if (oscuras.has(p.nombre)) await capturar(p, 'oscuro')
}
// Vista de escritorio de referencia (para ver el patrón sidebar)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: 8.3135, longitude: -73.612 } })
  const s = sesiones.estudiante
  await ctx.addInitScript((s) => { localStorage.setItem('token', s.token); localStorage.setItem('usuario', JSON.stringify(s.usuario)) }, s)
  const page = await ctx.newPage(); await page.goto(BASE + '/mapa'); await page.waitForTimeout(3000)
  await page.screenshot({ path: `${S}/shots/desktop-est-mapa.jpg`, type: 'jpeg', quality: 70 }); await ctx.close()
}
await browser.close()
fs.writeFileSync(`${S}/audit-medidas.json`, JSON.stringify(resultados, null, 1))
console.log('pantallas medidas:', resultados.length)
