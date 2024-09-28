import Image from "next/image"
import styles from "./page.module.css"
const chars = [
  {
    "name": "Aurix",
    "type": "hexadin",
    "id": 114605261,

  },
  {
    "name": "Syllari",
    "type": "rogue",
    "id": 114708176,
  },
  {
    "name": "Eins",
    "type": "wizard",
    "id": 119375779,
  },
  {
    "name": "Shrug",
    "type": "barbarian",
    "id": 114426963,
  },
  {
    "name": "Moriko",
    "type": "druid",
    "id": "moriko",
  }
]
export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Dungeon Syndrome</h1>
      <div className={styles.charGroup}>
        {chars.map((char, idx) => {
          const classType = styles[char.type]
          return (
            <a key={idx} href={`https://www.dndbeyond.com/characters/${char.id}`} target="_blank">
              <div className={styles.character}>
                <Image
                  className={`${styles.profile} ${classType}`}
                  width={50}
                  height={50}
                  alt={char.name}
                  src={`/images/${char.id}.png`} />
                <div>
                  <h3>{char.name}</h3>
                  <span className={classType}>{char.type}</span>
                </div>
              </div>
            </a>
          )
        }
        )}
      </div>
    </main>
  )
}

