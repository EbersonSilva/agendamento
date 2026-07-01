-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isManualSlot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "StudioConfig" ADD COLUMN     "ownerEmail" TEXT;
