import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faBus, faRoute } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import './PanelAdmin.css'

const accesos = [
  {
    icono: faUsers,
    titulo: 'Gestionar usuarios',
    descripcion: 'Administrar cuentas y roles',
    path: '/admin/usuarios',
  },
  {
    icono: faBus,
    titulo: 'Gestionar buses',
    descripcion: 'Crear, editar y eliminar buses',
    path: '/admin/buses',
  },
  {
    icono: faRoute,
    titulo: 'Gestionar rutas',
    descripcion: 'Crear, editar y eliminar rutas',
    path: '/admin/rutas',
  },
]

export default function PanelAdmin() {
  const navigate = useNavigate()

  return (
    <Layout titulo="Panel de Administrador">
      <div className="admin-page">
        <h2 className="admin-titulo">Panel de Administrador</h2>

        <div className="admin-grid">
          {accesos.map((item, i) => (
            <div
              key={i}
              className="admin-card"
              onClick={() => navigate(item.path)}
            >
              <div className="admin-card-icono">
                <FontAwesomeIcon icon={item.icono} />
              </div>
              <span className="admin-card-titulo">{item.titulo}</span>
              <span className="admin-card-desc">{item.descripcion}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}