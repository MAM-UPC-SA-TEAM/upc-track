import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth()
  const rol = usuario?.tipo_usuario

  if (cargando) return <div className="cargando">Cargando...</div>
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && (!rol || !roles.includes(rol))) return <Navigate to="/login" replace />

  return children
}