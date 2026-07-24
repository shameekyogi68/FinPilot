-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "rebalance_threshold_pct" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "risk_profile" TEXT NOT NULL DEFAULT 'balanced';
