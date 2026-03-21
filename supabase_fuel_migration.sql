-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'DIESEL_B7', 'DIESEL_B20', 'DIESEL_PREMIUM', 'GASOHOL_91', 'GASOHOL_95', 'GASOHOL_E20', 'GASOHOL_E85', 'BENZINE');

-- DropIndex
DROP INDEX "Station_status_fuelStatus_idx";

-- AlterTable
ALTER TABLE "Station" DROP COLUMN "fuelStatus",
DROP COLUMN "fuelUpdatedAt";

-- AlterTable
ALTER TABLE "FuelStatusLog" ADD COLUMN     "fuelType" "FuelType" NOT NULL;

-- AlterTable
ALTER TABLE "FuelReport" ADD COLUMN     "fuelType" "FuelType" NOT NULL;

-- CreateTable
CREATE TABLE "StationFuel" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "status" "FuelStatus" NOT NULL DEFAULT 'AVAILABLE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationFuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StationFuel_stationId_idx" ON "StationFuel"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "StationFuel_stationId_fuelType_key" ON "StationFuel"("stationId", "fuelType");

-- CreateIndex
CREATE INDEX "Station_status_idx" ON "Station"("status");

-- AddForeignKey
ALTER TABLE "StationFuel" ADD CONSTRAINT "StationFuel_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

