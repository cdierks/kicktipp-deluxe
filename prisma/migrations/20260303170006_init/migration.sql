-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `favoriteTeam` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_nickname_key`(`nickname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColorPalette` (
    `id` VARCHAR(191) NOT NULL,
    `hex` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `ColorPalette_hex_key`(`hex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Season` (
    `id` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Season_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Matchday` (
    `id` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `matchdayNumber` INTEGER NOT NULL,
    `status` ENUM('UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    `tippDeadline` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Matchday_seasonId_matchdayNumber_key`(`seasonId`, `matchdayNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` VARCHAR(191) NOT NULL,
    `matchdayId` VARCHAR(191) NOT NULL,
    `homeTeam` VARCHAR(191) NOT NULL,
    `awayTeam` VARCHAR(191) NOT NULL,
    `homeScore` INTEGER NULL,
    `awayScore` INTEGER NULL,
    `matchDate` DATETIME(3) NOT NULL,
    `openligaMatchId` INTEGER NOT NULL,
    `status` ENUM('SCHEDULED', 'LIVE', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',

    UNIQUE INDEX `Match_openligaMatchId_key`(`openligaMatchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tip` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `homeScore` INTEGER NOT NULL,
    `awayScore` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `isJoker` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Tip_userId_matchId_key`(`userId`, `matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Matchday` ADD CONSTRAINT `Matchday_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_matchdayId_fkey` FOREIGN KEY (`matchdayId`) REFERENCES `Matchday`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tip` ADD CONSTRAINT `Tip_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tip` ADD CONSTRAINT `Tip_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
