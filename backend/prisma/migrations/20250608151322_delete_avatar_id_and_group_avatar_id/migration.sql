/*
  Warnings:

  - You are about to drop the column `groupAvatarId` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `avatarId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "chats_groupAvatarId_key";

-- DropIndex
DROP INDEX "users_avatarId_key";

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "groupAvatarId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarId";
