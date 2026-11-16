import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/shared/Layout'
import '../components/inicio/Talon.css'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Perfil.css'

// Mi perfil: solo MUESTRA los datos. Para cambiarlos (datos, contraseña) está «Configuración».
export default function Perfil() {
  const { usuario } = useAuth()
  const correoActual = usuario?.correo || usuario?.email || ''

  const datos = [
    { clave: 'Nombre completo', valor: usuario?.nombre },
    { clave: 'Nombre de usuario', valor: usuario?.nombre_usuario },
    { clave: 'Correo electrónico', valor: correoActual },
  ]

  return (
    <Layout titulo="Mi perfil">
      <div className="lista-pagina">

        <section className="talon" aria-labelledby="perfil-nombre">
          <div className="talon-cuerpo perfil-cabo">
            <h2 id="perfil-nombre" className="perfil-nombre">{usuario?.nombre || 'Sin nombre'}</h2>
            <span className="etiqueta etiqueta--neutro perfil-rol">{usuario?.tipo_usuario}</span>
          </div>

          <div className="talon-perf" aria-hidden="true" />

          <div className="perfil-cuerpo">
            <h3 className="perfil-seccion">Datos personales</h3>
            <dl className="perfil-datos">
              {datos.map(d => (
                <div key={d.clave} className="perfil-dato">
                  <dt>{d.clave}</dt>
                  <dd>{d.valor || <span className="perfil-sin">Sin registrar</span>}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <Link to="/configuracion" className="boton-contorno perfil-ir-config">
          <FontAwesomeIcon icon={faGear} /> Configuración
        </Link>

      </div>
    </Layout>
  )
}
