/*
  Warnings:

  - You are about to drop the `OnlineStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OnlineStatus" DROP CONSTRAINT "OnlineStatus_userId_fkey";

-- DropTable
DROP TABLE "OnlineStatus";

-- CreateTable
CREATE TABLE "online_status" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "online_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_status_userId_key" ON "online_status"("userId");

-- AddForeignKey
ALTER TABLE "online_status" ADD CONSTRAINT "online_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
