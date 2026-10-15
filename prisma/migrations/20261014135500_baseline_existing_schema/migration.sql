-- CreateTable
CREATE TABLE `candidato_detalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministerio_id` INTEGER NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_candidato_nacional` DATE NULL,
    `notas` VARCHAR(255) NULL,

    UNIQUE INDEX `candidato_detalle_ministerio_id_key`(`ministerio_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cargos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cargo` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iglesias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(255) NULL,
    `municipio` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,
    `zona_id` INTEGER NOT NULL,
    `subzona_id` INTEGER NULL,
    `cp` INTEGER NULL,
    `latitud` DOUBLE NULL,
    `longitud` DOUBLE NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `iglesias_subzona_id_idx`(`subzona_id` ASC),
    INDEX `iglesias_zona_id_idx`(`zona_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministerio_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministerio_id` INTEGER NOT NULL,
    `cargo_id` INTEGER NOT NULL,

    INDEX `ministerio_cargo_cargo_id_idx`(`cargo_id` ASC),
    INDEX `ministerio_cargo_ministerio_id_idx`(`ministerio_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministerios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(20) NOT NULL,
    `apellidos` VARCHAR(60) NULL,
    `alias` VARCHAR(50) NULL,
    `dni_encrypted` VARCHAR(255) NULL,
    `nie_encrypted` VARCHAR(255) NULL,
    `iglesia_id` INTEGER NOT NULL,
    `codigo` VARCHAR(7) NULL,
    `estado_id` INTEGER NOT NULL,
    `tipo` VARCHAR(15) NOT NULL DEFAULT 'MINISTERIO',
    `aprob` INTEGER NULL,
    `telefono` VARCHAR(15) NULL,
    `email` VARCHAR(255) NULL,
    `imagen` LONGBLOB NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `codigo`(`codigo` ASC),
    INDEX `ministerios_estado_id_idx`(`estado_id` ASC),
    INDEX `ministerios_iglesia_id_idx`(`iglesia_id` ASC),
    INDEX `ministerios_tipo_idx`(`tipo` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `icono` VARCHAR(50) NULL,
    `href` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministerio_id` INTEGER NOT NULL,
    `observacion` VARCHAR(255) NOT NULL,

    INDEX `observaciones_ministerio_id_idx`(`ministerio_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pastores_iglesia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `iglesia_id` INTEGER NOT NULL,
    `ministerio_id` INTEGER NOT NULL,

    UNIQUE INDEX `pastores_iglesia_iglesia_id_key`(`iglesia_id` ASC),
    UNIQUE INDEX `pastores_iglesia_ministerio_id_key`(`ministerio_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_credencial_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER NOT NULL,
    `ministerio_id` INTEGER NOT NULL,
    `expedida` BOOLEAN NOT NULL DEFAULT false,
    `fecha_expedicion` DATETIME(3) NULL,

    INDEX `solicitud_credencial_items_ministerio_id_idx`(`ministerio_id` ASC),
    INDEX `solicitud_credencial_items_solicitud_id_idx`(`solicitud_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_credencial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    `notas` VARCHAR(500) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subzonas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `zona_id` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `subzonas_zona_id_idx`(`zona_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zonas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(10) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `candidato_detalle` ADD CONSTRAINT `candidato_detalle_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iglesias` ADD CONSTRAINT `iglesias_subzona_id_fkey` FOREIGN KEY (`subzona_id`) REFERENCES `subzonas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iglesias` ADD CONSTRAINT `iglesias_zona_id_fkey` FOREIGN KEY (`zona_id`) REFERENCES `zonas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ministerio_cargo` ADD CONSTRAINT `ministerio_cargo_cargo_id_fkey` FOREIGN KEY (`cargo_id`) REFERENCES `cargos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ministerio_cargo` ADD CONSTRAINT `ministerio_cargo_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ministerios` ADD CONSTRAINT `ministerios_estado_id_fkey` FOREIGN KEY (`estado_id`) REFERENCES `estados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ministerios` ADD CONSTRAINT `ministerios_iglesia_id_fkey` FOREIGN KEY (`iglesia_id`) REFERENCES `iglesias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observaciones` ADD CONSTRAINT `observaciones_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pastores_iglesia` ADD CONSTRAINT `pastores_iglesia_iglesia_id_fkey` FOREIGN KEY (`iglesia_id`) REFERENCES `iglesias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pastores_iglesia` ADD CONSTRAINT `pastores_iglesia_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_credencial_items` ADD CONSTRAINT `solicitud_credencial_items_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_credencial_items` ADD CONSTRAINT `solicitud_credencial_items_solicitud_id_fkey` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes_credencial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subzonas` ADD CONSTRAINT `subzonas_zona_id_fkey` FOREIGN KEY (`zona_id`) REFERENCES `zonas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
