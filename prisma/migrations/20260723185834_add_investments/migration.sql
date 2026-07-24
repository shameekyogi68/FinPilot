-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "target_cash_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "target_debt_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "target_equity_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "target_gold_pct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "investedAmount" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "units" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);
