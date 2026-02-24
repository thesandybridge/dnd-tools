-- CreateTable
CREATE TABLE "guild_roles" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "position" INTEGER NOT NULL,
    "manage_members" BOOLEAN NOT NULL DEFAULT false,
    "manage_maps" BOOLEAN NOT NULL DEFAULT false,
    "manage_markers" BOOLEAN NOT NULL DEFAULT false,
    "manage_guild" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_roles_guild_id_position_key" ON "guild_roles"("guild_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "guild_roles_guild_id_name_key" ON "guild_roles"("guild_id", "name");

-- AddForeignKey
ALTER TABLE "guild_roles" ADD CONSTRAINT "guild_roles_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default roles for every existing guild
INSERT INTO "guild_roles" ("guild_id", "name", "color", "position", "manage_members", "manage_maps", "manage_markers", "manage_guild", "is_system")
SELECT "guild_id", 'Guild Master', '#f59e0b', 0, true, true, true, true, true
FROM "guilds";

INSERT INTO "guild_roles" ("guild_id", "name", "color", "position", "manage_members", "manage_maps", "manage_markers", "manage_guild", "is_system")
SELECT "guild_id", 'Dungeon Master', '#8b5cf6', 1, true, true, true, false, true
FROM "guilds";

INSERT INTO "guild_roles" ("guild_id", "name", "color", "position", "manage_members", "manage_maps", "manage_markers", "manage_guild", "is_system")
SELECT "guild_id", 'Adventurer', '#6b7280', 2, false, false, true, false, true
FROM "guilds";

-- Add role_id column to guild_members (nullable initially)
ALTER TABLE "guild_members" ADD COLUMN "role_id" INTEGER;

-- Migrate existing role strings to role_id references
UPDATE "guild_members" gm
SET "role_id" = gr."id"
FROM "guild_roles" gr
WHERE gr."guild_id" = gm."guild_id"
  AND gr."position" = 0
  AND gm."role" = 'owner';

UPDATE "guild_members" gm
SET "role_id" = gr."id"
FROM "guild_roles" gr
WHERE gr."guild_id" = gm."guild_id"
  AND gr."position" = 1
  AND gm."role" = 'admin';

UPDATE "guild_members" gm
SET "role_id" = gr."id"
FROM "guild_roles" gr
WHERE gr."guild_id" = gm."guild_id"
  AND gr."position" = 2
  AND gm."role" = 'member';

-- Catch any remaining members (unknown role values) and assign Adventurer
UPDATE "guild_members" gm
SET "role_id" = gr."id"
FROM "guild_roles" gr
WHERE gr."guild_id" = gm."guild_id"
  AND gr."position" = 2
  AND gm."role_id" IS NULL;

-- Make role_id NOT NULL now that all rows are populated
ALTER TABLE "guild_members" ALTER COLUMN "role_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "guild_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old role column
ALTER TABLE "guild_members" DROP COLUMN "role";

-- Add visibility column to guild_maps
ALTER TABLE "guild_maps" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'everyone';
