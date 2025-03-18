/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_imageId_fkey";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "messageId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Image_messageId_key" ON "Image"("messageId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
