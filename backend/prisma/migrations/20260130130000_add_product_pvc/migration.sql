-- AlterTable
ALTER TABLE "products" ADD COLUMN     "pvc" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "products_pvc_idx" ON "products"("pvc");

