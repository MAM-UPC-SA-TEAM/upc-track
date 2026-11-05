const BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

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

    const res = await fetch(`${BASE_URL}${endpoint}`, config)

    let data = null
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