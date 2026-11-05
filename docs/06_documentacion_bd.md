# Documentacion de Base de Datos

## 1. Motor
MySQL

## 2. Entidades principales

### usuario
- id_usuario (PK)
- nombre
- correo
- password_hash
- tipo_usuario (admin, conductor, estudiante)
- activo

### bus
- id_bus (PK)
- nombre
- placa
- capacidad
- estado
- id_conductor (FK -> usuario.id_usuario)

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

## 3. Relaciones clave
- Un bus puede tener un conductor asignado.
- Una ruta tiene muchas paradas (ruta_parada).
- Un bus puede tener ruta asignada (bus_ruta).
- Una ruta puede tener multiples horarios.
- Una notificacion pertenece a una ruta y a un conductor.

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
WHERE rp.id_ruta = ?
ORDER BY rp.orden;
```

### Notificaciones del dia
```sql
SELECT tipo, mensaje, fecha_hora
FROM notificacion
WHERE DATE(fecha_hora) = CURDATE()
ORDER BY fecha_hora DESC;
```
