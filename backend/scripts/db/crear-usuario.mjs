// scripts/db/crear-usuario.mjs
// Crea (o actualiza la clave de) un usuario con una contrasena que TU eliges,
// sin que quede escrita en ningun archivo del repositorio.
//
//   USUARIO_CLAVE='una-clave-larga' npm run db:usuario -- \
//       --nombre "Administrador" --usuario admin --correo admin@unicesar.edu.co --tipo admin
//
// tipo: admin | conductor | estudiante. La clave se lee SOLO de la variable USUARIO_CLAVE.

import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { opcionesPool } from '../../src/config/conexion.js'

dotenv.config()

const args = process.argv.slice(2)
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
const { nombre, usuario, correo, tipo = 'estudiante' } = { nombre: val('--nombre'), usuario: val('--usuario'), correo: val('--correo'), tipo: val('--tipo') }
const clave = process.env.USUARIO_CLAVE

if (!nombre || !usuario || !correo) {
  console.error('Uso: USUARIO_CLAVE=... node ' + fileURLToPath(import.meta.url) + ' --nombre N --usuario U --correo C [--tipo admin|conductor|estudiante]')
  process.exit(1)
}
if (!['admin', 'conductor', 'estudiante'].includes(tipo)) {
  console.error('✗ --tipo debe ser admin, conductor o estudiante')
  process.exit(1)
}
if (!clave || clave.length < 12 || clave === 'Admin123*') {
  console.error('✗ Define USUARIO_CLAVE con al menos 12 caracteres (y distinta de la clave publica de demo).')
  process.exit(1)
}

const cliente = new pg.Client(opcionesPool())
try {
  await cliente.connect()
  const hash = await bcrypt.hash(clave, 10)
  const { rows } = await cliente.query(
    `INSERT INTO usuario (nombre, nombre_usuario, correo, password_hash, tipo_usuario)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (nombre_usuario) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, tipo_usuario = EXCLUDED.tipo_usuario, nombre = EXCLUDED.nombre
     RETURNING id_usuario, nombre_usuario, tipo_usuario`,
    [nombre, usuario.toLowerCase(), correo.toLowerCase(), hash, tipo]
  )
  console.log(`✔ ${rows[0].tipo_usuario} «${rows[0].nombre_usuario}» (id ${rows[0].id_usuario})`)
} catch (error) {
  console.error('✗', error.message)
  process.exitCode = 1
} finally {
  await cliente.end()
}
