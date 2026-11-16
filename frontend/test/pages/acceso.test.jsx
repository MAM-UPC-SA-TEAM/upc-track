// Pruebas funcionales: flujos de acceso (login, registro, guardas de rol y cierre de sesión)
// sobre la app completa; solo el backend y el socket son falsos.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante, conductor, admin } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)
// Destinos que no son el objeto de estas pruebas (mapa con Leaflet, geolocalización, etc.)
vi.mock('../../src/pages/Dashboard', () => ({ default: () => <h1>Pantalla de inicio</h1> }))
vi.mock('../../src/pages/admin/PanelAdmin', () => ({ default: () => <h1>Panel de administración</h1> }))
vi.mock('../../src/pages/conductor/MiRecorrido', () => ({ default: () => <h1>Mi recorrido</h1> }))
vi.mock('../../src/pages/MapaTiempoReal', () => ({ default: () => <h1>Mapa</h1> }))

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const titulo = (nombre) => screen.findByRole('heading', { name: nombre })

describe('Login', () => {
  it('sin sesión, entrar a una ruta protegida lleva al login', async () => {
    abrirApp('/rutas')
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('con los campos vacíos muestra los dos errores y no llama al backend', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    await user.click(await screen.findByRole('button', { name: /entrar/i }))
    expect(screen.getByText('Escribe tu nombre de usuario.')).toBeInTheDocument()
    expect(backend.llamadas).toHaveLength(0)
  })

  it('sin contraseña pide solo la contraseña y devuelve el foco ahí', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    await user.type(await screen.findByLabelText('Usuario'), 'ana')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(screen.queryByText('Escribe tu nombre de usuario.')).toBeNull()
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
  })

  it('el error desaparece al empezar a escribir en el campo', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    await user.click(await screen.findByRole('button', { name: /entrar/i }))
    await user.type(screen.getByLabelText('Usuario'), 'a')
    expect(screen.queryByText('Escribe tu nombre de usuario.')).toBeNull()
  })

  it('«Mostrar contraseña» alterna entre oculta y visible', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    const campo = await screen.findByLabelText('Contraseña')
    expect(campo).toHaveAttribute('type', 'password')
    await user.click(screen.getByLabelText('Mostrar contraseña'))
    expect(campo).toHaveAttribute('type', 'text')
  })

  it('credenciales incorrectas muestran el mensaje del servidor y siguen en el login', async () => {
    backend.respuestas['POST /api/auth/login'] = rechazo(401, 'Usuario o contraseña incorrectos')
    const user = userEvent.setup()
    abrirApp('/login')
    await user.type(await screen.findByLabelText('Usuario'), 'ana')
    await user.type(screen.getByLabelText('Contraseña'), 'equivocada1')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos')
    expect(window.location.pathname).toBe('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it.each([
    [estudiante, '/inicio', 'Pantalla de inicio'],
    [conductor, '/conductor', 'Mi recorrido'],
    [admin, '/admin', 'Panel de administración'],
  ])('login de %o redirige a %s', async (usuario, ruta, pantalla) => {
    backend.respuestas['POST /api/auth/login'] = { token: `h.${btoa(JSON.stringify({ ...usuario, exp: 9999999999 }))}.s`, usuario }
    const user = userEvent.setup()
    abrirApp('/login')
    await user.type(await screen.findByLabelText('Usuario'), usuario.nombre_usuario)
    await user.type(screen.getByLabelText('Contraseña'), 'clave1234')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await titulo(pantalla)).toBeInTheDocument()
    expect(window.location.pathname).toBe(ruta)
    expect(backend.llamadasA('POST', '/api/auth/login')[0].cuerpo).toEqual({ nombre_usuario: usuario.nombre_usuario, password: 'clave1234' })
    expect(localStorage.getItem('token')).toBeTruthy()
  })

  it('el enlace «Crear cuenta» lleva al registro', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    await user.click(await screen.findByRole('link', { name: 'Crear cuenta' }))
    expect(await titulo('Crear cuenta')).toBeInTheDocument()
  })
})

describe('Registro', () => {
  const llenar = async (user, datos = {}) => {
    const d = { nombre: 'Ana Pérez', usuario: 'Ana.Perez', correo: 'ana@unicesar.edu.co', clave: 'clave1234', confirmar: 'clave1234', ...datos }
    await user.type(await screen.findByLabelText('Nombre completo'), d.nombre)
    await user.type(screen.getByLabelText('Nombre de usuario'), d.usuario)
    await user.type(screen.getByLabelText('Correo electrónico'), d.correo)
    await user.type(screen.getByLabelText('Contraseña'), d.clave)
    await user.type(screen.getByLabelText('Confirmar contraseña'), d.confirmar)
  }

  it('formulario vacío muestra los errores de los campos obligatorios', async () => {
    const user = userEvent.setup()
    abrirApp('/registro')
    await user.click(await screen.findByRole('button', { name: /crear cuenta/i }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El nombre de usuario es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(backend.llamadas).toHaveLength(0)
  })

  it('valida usuario, correo, largo de contraseña y confirmación', async () => {
    const user = userEvent.setup()
    abrirApp('/registro')
    await llenar(user, { usuario: 'a b', correo: 'no-es-correo', clave: '123', confirmar: '456' })
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(screen.getByText(/Solo letras, números, puntos, guiones/)).toBeInTheDocument()
    expect(screen.getByText('Correo no válido')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres', { selector: '.campo-error span' })).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(backend.llamadas).toHaveLength(0)
  })

  it('registro correcto envía el usuario en minúsculas e inicia sesión directo', async () => {
    backend.respuestas['POST /api/auth/registro'] = { token: `h.${btoa(JSON.stringify({ ...estudiante, exp: 9999999999 }))}.s`, usuario: estudiante }
    const user = userEvent.setup()
    abrirApp('/registro')
    await llenar(user)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(await titulo('Pantalla de inicio')).toBeInTheDocument()
    expect(backend.llamadasA('POST', '/api/auth/registro')[0].cuerpo).toEqual({
      nombre: 'Ana Pérez', nombre_usuario: 'ana.perez', correo: 'ana@unicesar.edu.co', password: 'clave1234',
    })
  })

  it('si el backend no devuelve token muestra «Cuenta creada» y permite ir al login', async () => {
    const user = userEvent.setup()
    abrirApp('/registro')
    await llenar(user)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(await titulo('Cuenta creada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ir a iniciar sesión/i }))
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
  })

  it('un correo ya registrado muestra el error del servidor', async () => {
    backend.respuestas['POST /api/auth/registro'] = rechazo(400, 'Ya existe una cuenta con ese correo')
    const user = userEvent.setup()
    abrirApp('/registro')
    await llenar(user)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo')
  })
})

describe('Control de acceso por rol', () => {
  it('estudiante entra a /rutas', async () => {
    abrirApp('/rutas', estudiante)
    expect(await titulo('Rutas disponibles')).toBeInTheDocument()
  })

  it('estudiante NO entra a /admin: vuelve al login', async () => {
    abrirApp('/admin', estudiante)
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
  })

  it('conductor NO entra a /rutas: vuelve al login', async () => {
    abrirApp('/rutas', conductor)
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
  })

  it('admin entra a /admin', async () => {
    abrirApp('/admin', admin)
    expect(await titulo('Panel de administración')).toBeInTheDocument()
  })

  it('/inicio redirige a cada rol a su pantalla', async () => {
    abrirApp('/inicio', admin)
    expect(await titulo('Panel de administración')).toBeInTheDocument()
  })

  it('una sesión con el token vencido se descarta', async () => {
    abrirApp('/rutas', estudiante, { vencida: true })
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('una URL desconocida lleva al login', async () => {
    abrirApp('/no-existe')
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
  })
})

describe('Cerrar sesión', () => {
  it('avisa al backend, limpia la sesión y vuelve al login', async () => {
    const user = userEvent.setup()
    abrirApp('/rutas', estudiante)
    await titulo('Rutas disponibles')
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(await titulo('Iniciar sesión')).toBeInTheDocument()
    await waitFor(() => expect(backend.llamadasA('POST', '/api/auth/logout')).toHaveLength(1))
    expect(localStorage.getItem('token')).toBeNull()
    expect(socketFalso.disconnect).toHaveBeenCalled()
  })
})
