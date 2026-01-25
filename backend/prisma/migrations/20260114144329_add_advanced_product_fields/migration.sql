-- CreateEnum
CREATE TYPE "Presentation" AS ENUM ('PCE', 'SAC', 'BAR', 'KGS', 'FIL', 'BOTTE', 'CAISSE');

-- CreateEnum
CREATE TYPE "DLCType" AS ENUM ('LONGUE', 'COURTE', 'NORMAL');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "dlcType" "DLCType",
ADD COLUMN     "gencod" TEXT,
ADD COLUMN     "hasError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAdjusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInAnimation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInCampaign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOpportunity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presentation" "Presentation",
ADD COLUMN     "supplyDelay" INTEGER;

-- CreateIndex
CREATE INDEX "products_preAssigned_idx" ON "products"("preAssigned");

-- CreateIndex
CREATE INDEX "products_isOpportunity_idx" ON "products"("isOpportunity");

-- CreateIndex
CREATE INDEX "products_isInAnimation_idx" ON "products"("isInAnimation");

-- CreateIndex
CREATE INDEX "products_isInCampaign_idx" ON "products"("isInCampaign");

-- CreateIndex
CREATE INDEX "products_gencod_idx" ON "products"("gencod");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");
