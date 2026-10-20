-- AlterTable
ALTER TABLE `ministerios` ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `password_hash` VARCHAR(255) NULL,
    ADD COLUMN `username` VARCHAR(50) NULL,
    MODIFY `codigo` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `es_sistema` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permisos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `es_sistema` BOOLEAN NOT NULL DEFAULT false,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `permisos_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_modulo_permisos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rol_id` INTEGER NOT NULL,
    `modulo_id` INTEGER NOT NULL,
    `permiso_id` INTEGER NOT NULL,

    INDEX `rol_modulo_permisos_rol_id_idx`(`rol_id`),
    INDEX `rol_modulo_permisos_modulo_id_idx`(`modulo_id`),
    INDEX `rol_modulo_permisos_permiso_id_idx`(`permiso_id`),
    UNIQUE INDEX `rol_modulo_permisos_rol_id_modulo_id_permiso_id_key`(`rol_id`, `modulo_id`, `permiso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_cargos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rol_id` INTEGER NOT NULL,
    `cargo_id` INTEGER NOT NULL,

    INDEX `rol_cargos_rol_id_idx`(`rol_id`),
    INDEX `rol_cargos_cargo_id_idx`(`cargo_id`),
    UNIQUE INDEX `rol_cargos_rol_id_cargo_id_key`(`rol_id`, `cargo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `username` ON `ministerios`(`username`);

-- AddForeignKey
ALTER TABLE `rol_modulo_permisos` ADD CONSTRAINT `rol_modulo_permisos_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_modulo_permisos` ADD CONSTRAINT `rol_modulo_permisos_modulo_id_fkey` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_modulo_permisos` ADD CONSTRAINT `rol_modulo_permisos_permiso_id_fkey` FOREIGN KEY (`permiso_id`) REFERENCES `permisos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_cargos` ADD CONSTRAINT `rol_cargos_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_cargos` ADD CONSTRAINT `rol_cargos_cargo_id_fkey` FOREIGN KEY (`cargo_id`) REFERENCES `cargos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
