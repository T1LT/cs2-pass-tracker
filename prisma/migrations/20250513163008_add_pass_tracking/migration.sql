-- AlterTable
ALTER TABLE "Pass" ADD COLUMN     "currentStars" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStars" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SteamAccount" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SteamAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassSession" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "steamAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "starsStart" INTEGER NOT NULL,
    "starsEnd" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "completeDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SteamAccount_steamId_key" ON "SteamAccount"("steamId");

-- AddForeignKey
ALTER TABLE "PassSession" ADD CONSTRAINT "PassSession_passId_fkey" FOREIGN KEY ("passId") REFERENCES "Pass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassSession" ADD CONSTRAINT "PassSession_steamAccountId_fkey" FOREIGN KEY ("steamAccountId") REFERENCES "SteamAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassSession" ADD CONSTRAINT "PassSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
