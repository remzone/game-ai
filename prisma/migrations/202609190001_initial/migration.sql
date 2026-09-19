CREATE TABLE "SaveSlot" (
  "slot" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "seed" TEXT NOT NULL,
  "day" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "compressed" BYTEA NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaveSlot_pkey" PRIMARY KEY ("slot"),
  CONSTRAINT "SaveSlot_slot_range" CHECK ("slot" BETWEEN 0 AND 5)
);
