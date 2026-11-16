import { useSyncExternalStore } from 'react'
import { aplicarTema, esOscuro, guardarPreferenciaTema, leerPreferenciaTema } from '../utils/tema'

// Tema de la app como estado compartido: la barra superior (alternar rápido) y Configuración (elegir
// «Claro / Oscuro / Automático») leen y cambian lo mismo, y «Automático» reacciona cuando cambia el teléfono.
const oyentes = new Set()
const avisar = () => oyentes.forEach((f) => f())

export function establecerPreferenciaTema(preferencia) {
  guardarPreferenciaTema(preferencia)
  aplicarTema(esOscuro(preferencia))
  avisar()
}

function suscribir(oyente) {
  oyentes.add(oyente)
  const sistema = window.matchMedia?.('(prefers-color-scheme: dark)')
  const alCambiarSistema = () => {
    if (leerPreferenciaTema() !== 'auto') return
    aplicarTema(esOscuro('auto'))
    avisar()
  }
  sistema?.addEventListener?.('change', alCambiarSistema)
  return () => {
    oyentes.delete(oyente)
    sistema?.removeEventListener?.('change', alCambiarSistema)
  }
}

// La «foto» es un texto (preferencia + si se ve oscuro) para que React detecte también el cambio del sistema
const foto = () => `${leerPreferenciaTema()}:${esOscuro()}`

export function useTema() {
  const [preferencia, oscuroTexto] = useSyncExternalStore(suscribir, foto, () => 'claro:false').split(':')
  const oscuro = oscuroTexto === 'true'
  return {
    preferencia,
    oscuro,
    establecer: establecerPreferenciaTema,
    alternar: () => establecerPreferenciaTema(oscuro ? 'claro' : 'oscuro'),
  }
}
