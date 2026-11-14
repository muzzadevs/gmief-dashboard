CREATE TABLE `auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actor_id` INTEGER NULL,
    `actor_username` VARCHAR(50) NOT NULL,
    `actor_nombre` VARCHAR(150) NOT NULL,
    `accion` VARCHAR(30) NOT NULL,
    `entidad` VARCHAR(100) NOT NULL,
    `entidad_id` VARCHAR(100) NULL,
    `resumen` VARCHAR(500) NOT NULL,
    `detalles` JSON NULL,
    `metodo` VARCHAR(10) NOT NULL,
    `ruta` VARCHAR(255) NOT NULL,

    INDEX `auditoria_fecha_idx`(`fecha`),
    INDEX `auditoria_actor_username_fecha_idx`(`actor_username`, `fecha`),
    INDEX `auditoria_accion_fecha_idx`(`accion`, `fecha`),
    INDEX `auditoria_entidad_fecha_idx`(`entidad`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
