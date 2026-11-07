-- Datos de PRODUCCION (Neon). Sin usuarios y sin contrasenas: las cuentas se crean con
--   USUARIO_CLAVE='...' npm run db:usuario -- --nombre ... --usuario ... --correo ... --tipo ...
-- Es idempotente. Reemplazar la ruta, paradas y bus de ejemplo por los reales de la UPC
-- Seccional Aguachica antes de la sustentacion.

INSERT INTO ruta (id_ruta, nombre, descripcion, activa) VALUES
(1, 'Centro - UPC', 'Ruta desde el centro de Aguachica hasta la UPC', 1)
ON CONFLICT DO NOTHING;

INSERT INTO parada (id_parada, nombre, latitud, longitud, activa) VALUES
(1, 'Parque Principal', 8.3100000, -73.6170000, 1),
(2, 'UPC Seccional Aguachica', 8.3180000, -73.6050000, 1)
ON CONFLICT DO NOTHING;

INSERT INTO ruta_parada (id_ruta, id_parada, orden) VALUES (1, 1, 1), (1, 2, 2)
ON CONFLICT DO NOTHING;

INSERT INTO bus (id_bus, nombre, placa, capacidad, estado) VALUES (1, 'Bus 1', 'UPC-001', 45, 'inactivo')
ON CONFLICT DO NOTHING;

INSERT INTO bus_ruta (id_bus, id_ruta) VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO horario (id_horario, id_ruta, hora_salida, hora_llegada) VALUES (1, 1, '06:30:00', '07:00:00')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('ruta',    'id_ruta'),    GREATEST((SELECT MAX(id_ruta)    FROM ruta),    1));
SELECT setval(pg_get_serial_sequence('parada',  'id_parada'),  GREATEST((SELECT MAX(id_parada)  FROM parada),  1));
SELECT setval(pg_get_serial_sequence('bus',     'id_bus'),     GREATEST((SELECT MAX(id_bus)     FROM bus),     1));
SELECT setval(pg_get_serial_sequence('horario', 'id_horario'), GREATEST((SELECT MAX(id_horario) FROM horario), 1));
