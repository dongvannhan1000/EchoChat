/*
  Warnings:

  - You are about to drop the column `lastMessage` on the `user_chats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "lastMessage" TEXT;

-- AlterTable
ALTER TABLE "user_chats" DROP COLUMN "lastMessage";
