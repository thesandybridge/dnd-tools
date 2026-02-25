-- CreateTable
CREATE TABLE "guild_invites" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guild_invites_target_user_id_status_idx" ON "guild_invites"("target_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "guild_invites_guild_id_target_user_id_key" ON "guild_invites"("guild_id", "target_user_id");

-- AddForeignKey
ALTER TABLE "guild_invites" ADD CONSTRAINT "guild_invites_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_invites" ADD CONSTRAINT "guild_invites_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_invites" ADD CONSTRAINT "guild_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
