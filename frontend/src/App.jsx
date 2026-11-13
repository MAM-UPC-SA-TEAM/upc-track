import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { esNativa } from './utils/platform'
import RutaProtegida from './components/shared/RutaProtegida'
import ServidorDespertando from './components/shared/ServidorDespertando'
import CicloVidaNativo from './components/shared/CicloVidaNativo'

// Pages — las iremos creando en los siguientes issues
const Login = lazy(() => import('./pages/Login'))
const Registro = lazy(() => import('./pages/Registro'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MapaTiempoReal = lazy(() => import('./pages/MapaTiempoReal'))
const Rutas = lazy(() => import('./pages/Rutas'))
const Buses = lazy(() => import('./pages/Buses'))
const Notificaciones = lazy(() => import('./pages/Notificaciones'))
const Perfil = lazy(() => import('./pages/Perfil'))
const PanelAdmin = lazy(() => import('./pages/admin/PanelAdmin'))
const GestionUsuarios = lazy(() => import('./pages/admin/GestionUsuarios'))
const GestionBuses = lazy(() => import('./pages/admin/GestionBuses'))
const GestionRutas = lazy(() => import('./pages/admin/GestionRutas'))
const MiRecorrido = lazy(() => import('./pages/conductor/MiRecorrido'))

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
        {esNativa && <CicloVidaNativo />}
        <Suspense fallback={null}>
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
          {/* En la app nativa no hay landing: se arranca en el login */}
          <Route path="/" element={esNativa ? <Navigate to="/login" replace /> : <LandingPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}