import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import RutaProtegida from './components/shared/RutaProtegida'
import ServidorDespertando from './components/shared/ServidorDespertando'

// Pages — las iremos creando en los siguientes issues
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import MapaTiempoReal from './pages/MapaTiempoReal'
import Rutas from './pages/Rutas'
import Buses from './pages/Buses'
import Notificaciones from './pages/Notificaciones'
import Perfil from './pages/Perfil'
import PanelAdmin from './pages/admin/PanelAdmin'
import GestionUsuarios from './pages/admin/GestionUsuarios'
import GestionBuses from './pages/admin/GestionBuses'
import GestionRutas from './pages/admin/GestionRutas'
import MiRecorrido from './pages/conductor/MiRecorrido'

// La landing carga aparte para no pesar en el bundle de la app (ni en el APK).
const LandingPage = lazy(() => import('./features/landing/LandingPage'))

function InicioPorRol() {
  const { usuario } = useAuth()
  if (usuario?.tipo_usuario === 'admin') {
    return <Navigate to="/admin" replace />
  }
  if (usuario?.tipo_usuario === 'conductor') {
    return <Navigate to="/conductor" replace />
  }
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ServidorDespertando />
        <Routes>
          {/* Pública */}
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Estudiante y admin */}
          <Route path="/inicio" element={
            <RutaProtegida roles={['estudiante', 'admin', 'conductor']}>
              <InicioPorRol />
            </RutaProtegida>
          } />

          <Route path="/mapa" element={
            <RutaProtegida roles={['estudiante', 'admin']}>
              <MapaTiempoReal />
            </RutaProtegida>
          } />

          <Route path="/rutas" element={
            <RutaProtegida roles={['estudiante', 'admin']}>
              <Rutas />
            </RutaProtegida>
          } />

          <Route path="/buses" element={
            <RutaProtegida roles={['estudiante', 'admin']}>
              <Buses />
            </RutaProtegida>
          } />

          <Route path="/notificaciones" element={
            <RutaProtegida roles={['estudiante', 'conductor', 'admin']}>
              <Notificaciones />
            </RutaProtegida>
          } />

          <Route path="/perfil" element={
            <RutaProtegida roles={['estudiante', 'conductor', 'admin']}>
              <Perfil />
            </RutaProtegida>
          } />

          {/* Conductor */}
          <Route path="/conductor" element={
            <RutaProtegida roles={['conductor']}>
              <MiRecorrido/>
            </RutaProtegida>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <RutaProtegida roles={['admin']}>
              <PanelAdmin/>
            </RutaProtegida>
          } />

          <Route path="/admin/usuarios" element={
            <RutaProtegida roles={['admin']}>
              <GestionUsuarios/>
            </RutaProtegida>
          } />

          <Route path="/admin/buses" element={
            <RutaProtegida roles={['admin']}>
              <GestionBuses />
            </RutaProtegida>
          } />

          <Route path="/admin/rutas" element={
            <RutaProtegida roles={['admin']}>
              <GestionRutas/>
            </RutaProtegida>
          } />

          {/* Redirecciones */}
          <Route path="/" element={<Suspense fallback={null}><LandingPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}