/*
  Warnings:

  - Added the required column `guild_map_id` to the `markers` table without a default value. This is not possible if the table is not empty.

*/
-- Delete existing markers (they lack the new required guild_map_id)
DELETE FROM "markers";

-- AlterTable
ALTER TABLE "markers" ADD COLUMN     "guild_map_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "guild_maps" (
    "id" SERIAL NOT NULL,
    "map_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tileforge_slug" TEXT NOT NULL,
    "tileforge_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_maps_map_id_key" ON "guild_maps"("map_id");

-- CreateIndex
CREATE INDEX "guild_maps_guild_id_idx" ON "guild_maps"("guild_id");

-- CreateIndex
CREATE INDEX "markers_guild_map_id_idx" ON "markers"("guild_map_id");

-- AddForeignKey
ALTER TABLE "guild_maps" ADD CONSTRAINT "guild_maps_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markers" ADD CONSTRAINT "markers_guild_map_id_fkey" FOREIGN KEY ("guild_map_id") REFERENCES "guild_maps"("map_id") ON DELETE CASCADE ON UPDATE CASCADE;
