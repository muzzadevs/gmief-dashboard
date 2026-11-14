ALTER TABLE `observaciones`
  MODIFY COLUMN `fecha_creacion` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

UPDATE `observaciones`
SET `fecha_creacion` = NULL
WHERE `autor_id` IS NULL;
