/*
  Warnings:

  - You are about to drop the column `groupAvatar` on the `chats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chatId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupAvatarId]` on the table `chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "chatId" INTEGER;

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "groupAvatar",
ADD COLUMN     "groupAvatarId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Image_chatId_key" ON "Image"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "chats_groupAvatarId_key" ON "chats"("groupAvatarId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
