-- Migración: Crear tablas para el módulo de Gestor de Credenciales
-- Ejecutar manualmente en la base de datos

CREATE TABLE IF NOT EXISTS `solicitudes_credencial` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  `notas` VARCHAR(500) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `solicitud_credencial_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `solicitud_id` INT NOT NULL,
  `ministerio_id` INT NOT NULL,
  `expedida` BOOLEAN NOT NULL DEFAULT false,
  `fecha_expedicion` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `solicitud_credencial_items_solicitud_id_idx` (`solicitud_id`),
  INDEX `solicitud_credencial_items_ministerio_id_idx` (`ministerio_id`),
  CONSTRAINT `solicitud_credencial_items_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes_credencial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `solicitud_credencial_items_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insertar el módulo en el dashboard
INSERT INTO modulos (nombre, descripcion, icono, href, activo, orden) VALUES
('Gestor de Credenciales', 'Solicitud y expedición de credenciales de Ministro de Culto', 'credenciales', '/modulos/gestor-credenciales', 1, 3);
