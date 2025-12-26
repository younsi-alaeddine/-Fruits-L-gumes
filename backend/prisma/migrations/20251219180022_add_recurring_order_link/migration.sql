/*
  Warnings:

  - You are about to drop the column `customerSignature` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryNoteNumber` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `convertedFromQuoteId` on the `orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "deliveries_deliveryNoteNumber_idx";

-- DropIndex
DROP INDEX "deliveries_deliveryNoteNumber_key";

-- AlterTable
ALTER TABLE "deliveries" DROP COLUMN "customerSignature",
DROP COLUMN "deliveryNoteNumber",
DROP COLUMN "fileUrl";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "convertedFromQuoteId",
ADD COLUMN     "recurringOrderId" TEXT;

-- CreateIndex
CREATE INDEX "orders_recurringOrderId_idx" ON "orders"("recurringOrderId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_recurringOrderId_fkey" FOREIGN KEY ("recurringOrderId") REFERENCES "recurring_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
