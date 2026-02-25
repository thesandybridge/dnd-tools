-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "corona_intensity" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
ADD COLUMN     "particle_effect" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN     "theme_mode" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN     "theme_name" TEXT NOT NULL DEFAULT 'parchment';

-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT,
    "char_class" TEXT,
    "subclass" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "backstory" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
