/*
  Warnings:

  - You are about to drop the `PendingUpload` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PendingUpload";

-- CreateTable
CREATE TABLE "pending_uploads" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "userId" INTEGER,
    "previousKey" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_uploads_key_key" ON "pending_uploads"("key");
