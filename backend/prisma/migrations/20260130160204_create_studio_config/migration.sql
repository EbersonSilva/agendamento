-- CreateTable
CREATE TABLE "StudioConfig" (
    "id" SERIAL NOT NULL,
    "openingHour" INTEGER NOT NULL DEFAULT 8,
    "closingHour" INTEGER NOT NULL DEFAULT 18,
    "closedDays" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioConfig_pkey" PRIMARY KEY ("id")
);
