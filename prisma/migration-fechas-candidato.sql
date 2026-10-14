-- Añade y completa la fecha de inicio de Candidato Local.
ALTER TABLE `candidato_detalle`
  ADD COLUMN `fecha_candidato_local` DATE NULL;

-- Las fechas se derivan de los plazos oficiales, no de la fecha en que se consultó el registro.
UPDATE `candidato_detalle`
SET
  `fecha_candidato_local` = CASE
    WHEN DATE_ADD(`fecha_inicio`, INTERVAL 183 DAY) <= CURRENT_DATE
      THEN DATE_ADD(`fecha_inicio`, INTERVAL 183 DAY)
    ELSE NULL
  END,
  `fecha_candidato_nacional` = CASE
    WHEN DATE_ADD(`fecha_inicio`, INTERVAL 548 DAY) <= CURRENT_DATE
      THEN DATE_ADD(`fecha_inicio`, INTERVAL 548 DAY)
    ELSE NULL
  END;
