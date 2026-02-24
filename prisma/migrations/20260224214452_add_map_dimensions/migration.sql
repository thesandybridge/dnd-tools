-- AlterTable
ALTER TABLE "guild_maps" ADD COLUMN     "image_height" INTEGER,
ADD COLUMN     "image_width" INTEGER,
ADD COLUMN     "max_zoom" INTEGER NOT NULL DEFAULT 5;
