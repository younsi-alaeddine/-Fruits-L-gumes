-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('FRUITS', 'LEGUMES', 'HERBES', 'FRUITS_SECS');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'FRUITS';

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");
