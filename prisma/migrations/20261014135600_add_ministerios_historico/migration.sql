-- CreateTable
CREATE TABLE `ministerios_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministerio_id` INTEGER NOT NULL,
    `campo` VARCHAR(50) NOT NULL,
    `valor_anterior` VARCHAR(255) NULL,
    `valor_nuevo` VARCHAR(255) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ministerios_historico_ministerio_id_fecha_idx`(`ministerio_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ministerios_historico` ADD CONSTRAINT `ministerios_historico_ministerio_id_fkey` FOREIGN KEY (`ministerio_id`) REFERENCES `ministerios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
