/*
  Warnings:

  - You are about to drop the column `closingHour` on the `StudioConfig` table. All the data in the column will be lost.
  - You are about to drop the column `openingHour` on the `StudioConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudioConfig" DROP COLUMN "closingHour",
DROP COLUMN "openingHour",
ADD COLUMN     "closingTime" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "openingTime" INTEGER NOT NULL DEFAULT 8;
