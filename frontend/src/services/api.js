const BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

// Render free se suspende sin trafico y tarda hasta ~1 min en despertar. Mientras tanto
// la peticion falla (error de red) o el proxy responde 502/503/504: en vez de mostrar
// un error, se reintenta con espera y se avisa a la interfaz (ServidorDespertando).
const REINTENTO_ESTADOS = [502, 503, 504]
const ESPERA_AVISO_MS = 3000
const ESPERA_REINTENTO_MS = 3000
const LIMITE_MS = 90000
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

export const EVENTO_SERVIDOR = 'api:servidor-despertando'
let esperando = 0
function avisar(activo) {
  window.dispatchEvent(new CustomEvent(EVENTO_SERVIDOR, { detail: { activo } }))
}

// fetch con reintento solo ante fallo de red o 502/503/504 (la peticion no llego a procesarse).
async function fetchConReintento(url, config) {
  const inicio = Date.now()
  let aviso = null
  let avisado = false
  try {
    for (;;) {
      try {
        const res = await fetch(url, config)
        if (!REINTENTO_ESTADOS.includes(res.status)) return res
        if (Date.now() - inicio > LIMITE_MS) return res
      } catch (err) {
        if (Date.now() - inicio > LIMITE_MS) throw err
      }
      if (!aviso) {
        aviso = setTimeout(() => { avisado = true; esperando++; avisar(true) }, Math.max(0, ESPERA_AVISO_MS - (Date.now() - inicio)))
      }
      await dormir(ESPERA_REINTENTO_MS)
    }
  } finally {
    clearTimeout(aviso)
    if (avisado) {
      esperando--
      if (esperando === 0) avisar(false)
    }
  }
}

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const res = await fetchConReintento(`${BASE_URL}${endpoint}`, config)

    let data
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        data = await res.json()
      } catch {
        data = null
      }
    } else {
      try {
        const text = await res.text()
        data = text ? { message: text } : null
      } catch {
        data = null
      }
    }

    if (!res.ok) {
      const mensajeProxy = res.status === 502
        ? 'No hay conexión con el backend (502). Verifica que el servidor esté ejecutándose en el puerto 3000.'
        : null
      throw {
        status: res.status,
        message: mensajeProxy || data?.error || data?.message || 'Error del servidor',
      }
    }
    return data
  },

  get: (endpoint, opts) => api.request(endpoint, opts),
  post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
}

export default api