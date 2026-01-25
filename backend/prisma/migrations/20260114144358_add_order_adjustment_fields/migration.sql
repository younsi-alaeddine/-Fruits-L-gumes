-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "initialPackages" INTEGER,
ADD COLUMN     "isInAdjustment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProvisionalPVC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPackages" INTEGER,
ADD COLUMN     "minPackages" INTEGER,
ADD COLUMN     "totalHT_Perm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalHT_Promo" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalMargin_Perm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalMargin_Promo" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalPC_Perm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalPC_Promo" DOUBLE PRECISION DEFAULT 0;

-- CreateIndex
CREATE INDEX "orders_isInAdjustment_idx" ON "orders"("isInAdjustment");
