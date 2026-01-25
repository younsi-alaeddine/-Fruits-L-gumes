-- CreateEnum
CREATE TYPE "Origin" AS ENUM ('FRANCE', 'ESPAGNE', 'MAROC', 'PORTUGAL', 'ITALIE', 'BELGIQUE', 'PAYS_BAS', 'AUTRE');

-- CreateEnum
CREATE TYPE "Packaging" AS ENUM ('KG', 'UC', 'BAR', 'SAC', 'PCE', 'FIL', 'BOTTE', 'CAISSE');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "margin" DOUBLE PRECISION,
ADD COLUMN     "marginAmount" DOUBLE PRECISION,
ADD COLUMN     "priceHT_T2" DOUBLE PRECISION,
ADD COLUMN     "quantityOrdered" DOUBLE PRECISION,
ADD COLUMN     "quantityPromo" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "department" TEXT DEFAULT 'Fruits et Légumes',
ADD COLUMN     "grouping" TEXT,
ADD COLUMN     "orderDate" TIMESTAMP(3),
ADD COLUMN     "pricingType" TEXT DEFAULT 'T1',
ADD COLUMN     "promoRevenue" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "promoRevenuePercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalMargin" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalMarginPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalPackages" INTEGER DEFAULT 0,
ADD COLUMN     "totalWeight" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cessionPrice" DOUBLE PRECISION,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "margin" DOUBLE PRECISION,
ADD COLUMN     "marginAmount" DOUBLE PRECISION,
ADD COLUMN     "origin" "Origin",
ADD COLUMN     "packaging" "Packaging",
ADD COLUMN     "priceHT_T2" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "internal_messages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_deadlines" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "deadlineHour" INTEGER NOT NULL,
    "deadlineMinute" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_messages_isActive_idx" ON "internal_messages"("isActive");

-- CreateIndex
CREATE INDEX "internal_messages_type_idx" ON "internal_messages"("type");

-- CreateIndex
CREATE INDEX "internal_messages_validFrom_validTo_idx" ON "internal_messages"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "order_deadlines_dayOfWeek_idx" ON "order_deadlines"("dayOfWeek");

-- CreateIndex
CREATE INDEX "order_deadlines_isActive_idx" ON "order_deadlines"("isActive");

-- CreateIndex
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX "orders_deliveryDate_idx" ON "orders"("deliveryDate");

-- CreateIndex
CREATE INDEX "products_isBlocked_idx" ON "products"("isBlocked");
