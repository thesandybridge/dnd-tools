import type { Character, Guild, GuildMap, GuildMember, GuildRole, Marker, User } from "@/lib/generated/prisma/client"

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

/** GuildRole → snake_case fields */
export function serializeRole(r: GuildRole) {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    position: r.position,
    manage_members: r.manageMembers,
    manage_maps: r.manageMaps,
    manage_markers: r.manageMarkers,
    manage_guild: r.manageGuild,
    is_system: r.isSystem,
  }
}

/** GuildMember with included user and role → { guild_id, user_id, role, users: { id, name, email } } */
export function serializeMember(m: GuildMember & { role: GuildRole; user: Pick<User, "id" | "name" | "email"> }) {
  return {
    guild_id: m.guildId,
    user_id: m.userId,
    role: serializeRole(m.role),
    users: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    },
  }
}

/** GuildMember → { user_id, role_id, joined_at, role? } */
export function serializeMemberBasic(m: GuildMember & { role?: GuildRole }) {
  return {
    user_id: m.userId,
    role_id: m.roleId,
    joined_at: m.joinedAt,
    ...(m.role ? { role: serializeRole(m.role) } : {}),
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
    visibility: m.visibility,
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

/** User → public profile fields */
export function serializeUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    color: u.color,
    bio: u.bio,
    theme_name: u.themeName,
    theme_mode: u.themeMode,
    particle_effect: u.particleEffect,
    corona_intensity: u.coronaIntensity,
  }
}

/** Character → snake_case fields */
export function serializeCharacter(c: Character) {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    race: c.race,
    char_class: c.charClass,
    subclass: c.subclass,
    level: c.level,
    backstory: c.backstory,
    avatar_url: c.avatarUrl,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}
