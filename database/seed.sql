USE bd_monitoreo_buses;

-- Contraseña de todos los usuarios de prueba: Admin123*
INSERT IGNORE INTO usuario (nombre, nombre_usuario, correo, password_hash, tipo_usuario) VALUES
('Administrador',   'admin',      'admin@upc.edu.co',      '$2b$10$XheSpHKYl2vqy88edTH3d.hw9JZwEAZTqWXWud.tD6x/NGu9NWala', 'admin'),
('Conductor Demo',  'conductor',  'conductor@upc.edu.co',  '$2b$10$XheSpHKYl2vqy88edTH3d.hw9JZwEAZTqWXWud.tD6x/NGu9NWala', 'conductor'),
('Estudiante Demo', 'estudiante', 'estudiante@upc.edu.co', '$2b$10$XheSpHKYl2vqy88edTH3d.hw9JZwEAZTqWXWud.tD6x/NGu9NWala', 'estudiante');

INSERT IGNORE INTO ruta (id_ruta, nombre, descripcion, activa) VALUES
(1, 'Centro - UPC', 'Ruta demo desde el centro de Aguachica hasta la UPC', 1);

INSERT IGNORE INTO parada (id_parada, nombre, latitud, longitud, activa) VALUES
(1, 'Parque Principal', 8.3100000, -73.6170000, 1),
(2, 'UPC Seccional Aguachica', 8.3180000, -73.6050000, 1);

INSERT IGNORE INTO ruta_parada (id_ruta, id_parada, orden) VALUES (1, 1, 1), (1, 2, 2);

INSERT IGNORE INTO bus (id_bus, nombre, placa, capacidad, estado, id_conductor)
SELECT 1, 'Bus 1', 'UPC-001', 45, 'inactivo', id_usuario FROM usuario WHERE nombre_usuario = 'conductor';

INSERT IGNORE INTO bus_ruta (id_bus, id_ruta) VALUES (1, 1);
INSERT IGNORE INTO horario (id_horario, id_ruta, hora_salida, hora_llegada) VALUES (1, 1, '06:30:00', '07:00:00');
