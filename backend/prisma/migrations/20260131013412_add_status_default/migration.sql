/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
