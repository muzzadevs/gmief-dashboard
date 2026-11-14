ALTER TABLE `observaciones`
  ADD COLUMN `autor_id` INTEGER NULL,
  ADD COLUMN `autor_nombre` VARCHAR(100) NULL,
  ADD COLUMN `autor_username` VARCHAR(50) NULL,
  ADD COLUMN `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `fecha_actualizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `observaciones_autor_id_idx` ON `observaciones`(`autor_id`);

ALTER TABLE `observaciones`
  ADD CONSTRAINT `observaciones_autor_id_fkey`
  FOREIGN KEY (`autor_id`) REFERENCES `ministerios`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
