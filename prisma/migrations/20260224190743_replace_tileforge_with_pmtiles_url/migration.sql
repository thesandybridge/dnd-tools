/*
  Warnings:

  - You are about to drop the column `tileforge_key` on the `guild_maps` table. All the data in the column will be lost.
  - You are about to drop the column `tileforge_slug` on the `guild_maps` table. All the data in the column will be lost.
  - Added the required column `pmtiles_url` to the `guild_maps` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "guild_maps" DROP COLUMN "tileforge_key",
DROP COLUMN "tileforge_slug",
ADD COLUMN     "pmtiles_url" TEXT NOT NULL;
