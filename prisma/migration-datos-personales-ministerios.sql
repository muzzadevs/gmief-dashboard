-- Añade fecha de nacimiento y dirección particular a los ministerios.
ALTER TABLE `ministerios`
  ADD COLUMN `fecha_nacimiento` DATE NULL,
  ADD COLUMN `direccion_particular` VARCHAR(255) NULL;
