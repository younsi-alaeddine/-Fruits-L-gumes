-- AlterTable
ALTER TABLE "products" ADD COLUMN     "subCategory" TEXT;

-- CreateIndex
CREATE INDEX "products_subCategory_idx" ON "products"("subCategory");
