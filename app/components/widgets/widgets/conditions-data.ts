export type Condition = {
  name: string
  description: string
  bullets: string[]
}

export const CONDITIONS: Condition[] = [
  {
    name: "Blinded",
    description: "A blinded creature can't see.",
    bullets: [
      "Automatically fails ability checks requiring sight",
      "Attack rolls against have advantage, its attacks have disadvantage",
    ],
  },
  {
    name: "Charmed",
    description:
      "A charmed creature can't attack or target the charmer with harmful effects.",
    bullets: [
      "The charmer has advantage on social ability checks against it",
    ],
  },
  {
    name: "Deafened",
    description: "A deafened creature can't hear.",
    bullets: ["Automatically fails ability checks requiring hearing"],
  },
  {
    name: "Exhaustion",
    description: "Exhaustion has cumulative levels (1-6).",
    bullets: [
      "1: Disadvantage on ability checks",
      "2: Speed halved",
      "3: Disadvantage on attack rolls and saving throws",
      "4: Hit point maximum halved",
      "5: Speed reduced to 0",
      "6: Death",
    ],
  },
  {
    name: "Frightened",
    description:
      "A frightened creature has disadvantage on ability checks and attack rolls while the source of fear is in sight.",
    bullets: ["Can't willingly move closer to the source of fear"],
  },
  {
    name: "Grappled",
    description: "A grappled creature's speed becomes 0.",
    bullets: [
      "Can't benefit from bonuses to speed",
      "Ends if grappler is incapacitated or moved apart",
    ],
  },
  {
    name: "Incapacitated",
    description: "An incapacitated creature can't take actions or reactions.",
    bullets: [],
  },
  {
    name: "Invisible",
    description:
      "An invisible creature is impossible to see without special means.",
    bullets: [
      "Considered heavily obscured for hiding",
      "Attacks against have disadvantage, its attacks have advantage",
    ],
  },
  {
    name: "Paralyzed",
    description:
      "A paralyzed creature is incapacitated and can't move or speak.",
    bullets: [
      "Automatically fails Strength and Dexterity saving throws",
      "Attacks against have advantage",
      "Melee hits within 5 feet are automatic critical hits",
    ],
  },
  {
    name: "Petrified",
    description:
      "A petrified creature is transformed into a solid inanimate substance.",
    bullets: [
      "Weight increases by a factor of ten",
      "Stops aging",
      "Incapacitated, can't move or speak",
      "Resistance to all damage",
      "Immune to poison and disease",
    ],
  },
  {
    name: "Poisoned",
    description:
      "A poisoned creature has disadvantage on attack rolls and ability checks.",
    bullets: [],
  },
  {
    name: "Prone",
    description: "A prone creature's only movement option is to crawl.",
    bullets: [
      "Disadvantage on attack rolls",
      "Melee attacks within 5 feet have advantage, ranged have disadvantage",
      "Can stand up by spending half movement",
    ],
  },
  {
    name: "Restrained",
    description: "A restrained creature's speed becomes 0.",
    bullets: [
      "Attacks against have advantage, its attacks have disadvantage",
      "Disadvantage on Dexterity saving throws",
    ],
  },
  {
    name: "Stunned",
    description:
      "A stunned creature is incapacitated, can't move, and can speak only falteringly.",
    bullets: [
      "Automatically fails Strength and Dexterity saving throws",
      "Attacks against have advantage",
    ],
  },
  {
    name: "Unconscious",
    description:
      "An unconscious creature is incapacitated, can't move or speak, and is unaware.",
    bullets: [
      "Drops whatever it's holding and falls prone",
      "Automatically fails Strength and Dexterity saving throws",
      "Attacks against have advantage",
      "Melee hits within 5 feet are automatic critical hits",
    ],
  },
]
