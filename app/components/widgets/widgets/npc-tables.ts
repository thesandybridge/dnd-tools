export const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Half-Orc", "Gnome", "Tiefling", "Dragonborn"]

export const FIRST_NAMES: Record<string, string[]> = {
  Human: ["Aldric", "Brenna", "Corwin", "Elara", "Gareth", "Helena", "Jorik", "Lyra", "Marcus", "Nadia", "Owen", "Sera"],
  Elf: ["Aelindra", "Caelynn", "Draven", "Elandril", "Faenor", "Galathil", "Ilyana", "Lyriel", "Miriel", "Thalion", "Vaelin", "Yavanna"],
  Dwarf: ["Barik", "Dolgrin", "Greta", "Helga", "Kragen", "Morga", "Rurik", "Svala", "Thorin", "Throrin", "Ulfgar", "Vondra"],
  Halfling: ["Bramble", "Cora", "Finnan", "Jasper", "Lidda", "Milo", "Nedda", "Osborn", "Pip", "Rosie", "Seraphina", "Welby"],
  "Half-Orc": ["Brug", "Dench", "Feng", "Grath", "Henk", "Keth", "Mhurren", "Ront", "Shump", "Thokk", "Varg", "Yurk"],
  Gnome: ["Bimpnottin", "Dimble", "Ellywick", "Frug", "Gimble", "Jebeddo", "Namfoodle", "Oda", "Roondar", "Seebo", "Waywocket", "Zook"],
  Tiefling: ["Akta", "Bryseis", "Criella", "Damakos", "Ekemon", "Iados", "Kairon", "Leucis", "Makos", "Orianna", "Pelaios", "Rieta"],
  Dragonborn: ["Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv", "Medrash", "Nala", "Pandjed", "Rhogar", "Torinn"],
}

export const OCCUPATIONS = [
  "Blacksmith", "Innkeeper", "Herbalist", "Merchant", "Scholar",
  "Guard Captain", "Tavern Singer", "Fishmonger", "Alchemist", "Scribe",
  "Bounty Hunter", "Stable Master", "Fortune Teller", "Brewer", "Cartographer",
  "Locksmith", "Chandler", "Tanner", "Jeweler", "Apothecary",
]

export const QUIRKS = [
  "Speaks in the third person",
  "Collects unusual buttons",
  "Hums when nervous",
  "Always carries a lucky coin",
  "Refers to everyone as 'friend'",
  "Has a distinctive scar they won't explain",
  "Obsessed with a particular food",
  "Quotes ancient proverbs constantly",
  "Whispers instead of speaking normally",
  "Laughs at inappropriate moments",
  "Always looking over their shoulder",
  "Compulsively organizes things",
  "Claims to have met a dragon",
  "Never makes eye contact",
  "Speaks with an accent no one can place",
  "Has strong opinions about the weather",
  "Fidgets with a small trinket",
  "Tells long-winded stories about their youth",
  "Insists on formal titles and etiquette",
  "Keeps a journal and writes in it mid-conversation",
]

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
