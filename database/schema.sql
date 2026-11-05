CREATE DATABASE IF NOT EXISTS bd_monitoreo_buses CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_monitoreo_buses;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  nombre_usuario VARCHAR(50)  NOT NULL UNIQUE,
  correo         VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  tipo_usuario   ENUM('admin','conductor','estudiante') NOT NULL DEFAULT 'estudiante',
  activo         TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bus (
  id_bus       INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  placa        VARCHAR(20)  NOT NULL UNIQUE,
  capacidad    INT NOT NULL DEFAULT 45,
  estado       ENUM('en_recorrido','detenido','fuera_de_servicio','inactivo') NOT NULL DEFAULT 'inactivo',
  id_conductor INT NULL,
  FOREIGN KEY (id_conductor) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ruta (
  id_ruta     INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  activa      TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS parada (
  id_parada INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  latitud   DECIMAL(10,7) NOT NULL,
  longitud  DECIMAL(10,7) NOT NULL,
  activa    TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ruta_parada (
  id_ruta   INT NOT NULL,
  id_parada INT NOT NULL,
  orden     INT NOT NULL,
  PRIMARY KEY (id_ruta, id_parada),
  FOREIGN KEY (id_ruta)   REFERENCES ruta(id_ruta)     ON DELETE CASCADE,
  FOREIGN KEY (id_parada) REFERENCES parada(id_parada) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bus_ruta (
  id_bus  INT NOT NULL,
  id_ruta INT NOT NULL,
  PRIMARY KEY (id_bus, id_ruta),
  FOREIGN KEY (id_bus)  REFERENCES bus(id_bus)   ON DELETE CASCADE,
  FOREIGN KEY (id_ruta) REFERENCES ruta(id_ruta) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS horario (
  id_horario   INT AUTO_INCREMENT PRIMARY KEY,
  id_ruta      INT NOT NULL,
  hora_salida  TIME NOT NULL,
  hora_llegada TIME NOT NULL,
  FOREIGN KEY (id_ruta) REFERENCES ruta(id_ruta) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ubicacion_bus (
  id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
  id_bus       INT NOT NULL,
  latitud      DECIMAL(10,7) NOT NULL,
  longitud     DECIMAL(10,7) NOT NULL,
  fecha_hora   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bus_fecha (id_bus, fecha_hora),
  FOREIGN KEY (id_bus) REFERENCES bus(id_bus) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_ruta         INT NULL,
  id_conductor    INT NULL,
  tipo            ENUM('cambio_ruta','retraso','info') NOT NULL DEFAULT 'info',
  mensaje         TEXT NOT NULL,
  fecha_hora      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ruta)      REFERENCES ruta(id_ruta)       ON DELETE CASCADE,
  FOREIGN KEY (id_conductor) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  id_usuario INT NOT NULL,
  id_ruta    INT NOT NULL,
  PRIMARY KEY (id_usuario, id_ruta),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_ruta)    REFERENCES ruta(id_ruta)       ON DELETE CASCADE
);
