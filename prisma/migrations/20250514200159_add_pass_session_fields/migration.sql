-- AlterTable
ALTER TABLE "PassSession" ADD COLUMN     "purchasedPass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starsEarned" INTEGER NOT NULL DEFAULT 0;
