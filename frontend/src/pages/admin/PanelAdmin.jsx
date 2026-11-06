import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faBus, faRoute, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import '../../components/inicio/Talon.css'
import '../../components/listas/Listas.css'
import '../../components/admin/Admin.css'

const accesos = [
  { icono: faUsers, titulo: 'Gestionar usuarios', descripcion: 'Administrar cuentas y roles', path: '/admin/usuarios' },
  { icono: faBus, titulo: 'Gestionar buses', descripcion: 'Crear, editar y eliminar buses', path: '/admin/buses' },
  { icono: faRoute, titulo: 'Gestionar rutas', descripcion: 'Crear, editar y eliminar rutas, paradas y horarios', path: '/admin/rutas' },
]

export default function PanelAdmin() {
  return (
    <Layout titulo="Panel de Administrador">
      <div className="adm-pagina">
        <h2 className="solo-lectura">Accesos de administración</h2>
        <section className="talon">
          <ul className="panel-accesos">
            {accesos.map(a => (
              <li key={a.path}>
                <Link to={a.path} className="panel-acceso">
                  <FontAwesomeIcon icon={a.icono} className="panel-acceso-icono" />
                  <span className="panel-acceso-texto">
                    <strong>{a.titulo}</strong>
                    <span>{a.descripcion}</span>
                  </span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  )
}
