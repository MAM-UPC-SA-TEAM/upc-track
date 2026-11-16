import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EsqueletoHoja } from './Esqueleto'

export default function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth()
  const rol = usuario?.tipo_usuario

  if (cargando) return <EsqueletoHoja />
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && (!rol || !roles.includes(rol))) return <Navigate to="/login" replace />

  return children
}