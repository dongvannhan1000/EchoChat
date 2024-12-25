-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('normal', 'system');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'normal';
