-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "essential" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "income_averaging_months" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "safety_buffer_months" DOUBLE PRECISION NOT NULL DEFAULT 3;
