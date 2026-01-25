-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "tvaNumber" TEXT;

-- CreateIndex
CREATE INDEX "shops_siret_idx" ON "shops"("siret");
