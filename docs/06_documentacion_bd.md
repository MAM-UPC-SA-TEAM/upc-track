# Documentacion de Base de Datos

## 1. Motor
PostgreSQL 16 (Neon en producción). Esquema en `database/schema.sql`: `correo`, `nombre_usuario` y `placa` son `CITEXT` (no distinguen mayúsculas), `activo`/`activa` son `SMALLINT` 0/1 y las fechas son `TIMESTAMPTZ`.

## 2. Entidades principales

### usuario
- id_usuario (PK)
- nombre
- nombre_usuario (único, `CITEXT`)
- correo (único, `CITEXT`)
- password_hash (bcrypt)
- tipo_usuario (admin, conductor, estudiante)
- activo (1 = puede iniciar sesión; 0 = cuenta pendiente de aprobación del administrador o desactivada)
- fecha_creacion

### bus
- id_bus (PK)
- nombre
- placa
- capacidad
- estado (en_recorrido, detenido, fuera_de_servicio, inactivo)
- id_conductor (FK -> usuario.id_usuario, `ON DELETE SET NULL`)

### ruta
- id_ruta (PK)
- nombre
- descripcion
- activa

### parada
- id_parada (PK)
- nombre
- latitud
- longitud
- activa

### ruta_parada
- id_ruta (FK)
- id_parada (FK)
- orden

### bus_ruta
- id_bus (FK)
- id_ruta (FK)

### horario
- id_horario (PK)
- id_ruta (FK)
- hora_salida
- hora_llegada

### ubicacion_bus
- id_ubicacion (PK)
- id_bus (FK)
- latitud
- longitud
- fecha_hora

### notificacion
- id_notificacion (PK)
- id_ruta (FK)
- id_conductor (FK)
- tipo (cambio_ruta, retraso, info)
- mensaje
- fecha_hora

### favoritos
- id_usuario (FK)
- id_ruta (FK)

Clave primaria compuesta (id_usuario, id_ruta). Existe en el esquema, pero la interfaz actual no la usa.

## 3. Relaciones clave
- Un bus puede tener un conductor asignado.
- Una ruta tiene muchas paradas (ruta_parada).
- Un bus puede tener ruta asignada (bus_ruta).
- Una ruta puede tener multiples horarios.
- Una notificacion pertenece a una ruta y a un conductor.
- Al borrar una ruta se borran en cascada sus paradas asignadas, horarios, asignaciones de bus y notificaciones; al borrar un conductor su bus queda sin conductor.
- `ubicacion_bus` guarda cada posición recibida; el índice `idx_bus_fecha (id_bus, fecha_hora)` acelera la consulta de la última posición de cada bus.

## 3.1 Cómo se crea y se carga
- `database/schema.sql`: esquema completo (idempotente, `CREATE ... IF NOT EXISTS`).
- `database/seed.sql`: datos de demostración con usuarios de clave pública `Admin123*`; **solo para desarrollo** (`migrate.mjs` se niega a aplicarlo sobre `DATABASE_URL`).
- `database/seed.prod.sql`: rutas, paradas y buses reales sin usuarios; los usuarios de producción se crean con `npm run db:usuario` en `backend/`.
- `npm run db:migrate [-- --seed seed.sql]` (en `backend/`) aplica el esquema de forma reproducible, también contra Neon.

## 4. Consultas utiles de verificacion

### Bus con ruta y conductor
```sql
SELECT b.id_bus, b.nombre, u.nombre AS conductor, r.nombre AS ruta
FROM bus b
LEFT JOIN usuario u ON u.id_usuario = b.id_conductor
LEFT JOIN bus_ruta br ON br.id_bus = b.id_bus
LEFT JOIN ruta r ON r.id_ruta = br.id_ruta;
```

### Paradas por ruta
```sql
SELECT p.nombre, rp.orden, p.latitud, p.longitud
FROM ruta_parada rp
JOIN parada p ON p.id_parada = rp.id_parada
WHERE rp.id_ruta = $1
ORDER BY rp.orden;
```

### Notificaciones del dia
```sql
SELECT tipo, mensaje, fecha_hora
FROM notificacion
WHERE fecha_hora::date = CURRENT_DATE
ORDER BY fecha_hora DESC;
```
