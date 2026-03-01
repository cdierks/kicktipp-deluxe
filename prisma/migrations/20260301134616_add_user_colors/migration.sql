-- AlterTable
ALTER TABLE "User" ADD COLUMN "color" TEXT;

-- CreateTable
CREATE TABLE "ColorPalette" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hex" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorPalette_hex_key" ON "ColorPalette"("hex");
