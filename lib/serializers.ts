import type { Guild, GuildMap, GuildMember, Marker, User } from "@/lib/generated/prisma/client"

/** Guild → { id, guild_id, name, owner } */
export function serializeGuild(g: Guild) {
  return {
    id: g.id,
    guild_id: g.guildId,
    name: g.name,
    owner: g.ownerId,
  }
}

/** Guild with included ownerUser → { id, guild_id, name, owner: { name } } */
export function serializeGuildWithOwner(g: Guild & { ownerUser: { name: string | null } }) {
  return {
    id: g.id,
    guild_id: g.guildId,
    name: g.name,
    owner: { name: g.ownerUser.name },
  }
}

/** GuildMember with included user → { guild_id, user_id, role, users: { id, name, email } } */
export function serializeMember(m: GuildMember & { user: Pick<User, "id" | "name" | "email"> }) {
  return {
    guild_id: m.guildId,
    user_id: m.userId,
    role: m.role,
    users: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    },
  }
}

/** GuildMember → { user_id, role, joined_at } */
export function serializeMemberBasic(m: GuildMember) {
  return {
    user_id: m.userId,
    role: m.role,
    joined_at: m.joinedAt,
  }
}

/** GuildMap → snake_case fields */
export function serializeGuildMap(m: GuildMap) {
  return {
    id: m.id,
    map_id: m.mapId,
    guild_id: m.guildId,
    name: m.name,
    pmtiles_url: m.pmtilesUrl,
    image_width: m.imageWidth,
    image_height: m.imageHeight,
    max_zoom: m.maxZoom,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }
}

/** Marker → snake_case fields */
export function serializeMarker(m: Marker) {
  return {
    id: m.id,
    uuid: m.uuid,
    user_id: m.userId,
    position: m.position,
    distance: m.distance,
    prev_marker: m.prevMarker,
    created_at: m.createdAt,
    text: m.text,
  }
}
