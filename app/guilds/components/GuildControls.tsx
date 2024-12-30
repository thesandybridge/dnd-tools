'use client'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { createGuild } from "@/lib/guilds"
import styles from "./guilds.module.css"

export default function GuildControls() {
  const controls = [
    {
      label: "Create Guild",
      action: createGuild,
      icon: faPlus
    }
  ]

  return (
    <nav className={styles.guildNav}>
      {controls.map((control, idx) => (
        <button
          key={idx}
          onClick={() => control.action()}
          aria-label={control.label}
          title={control.label}
          className={`${styles.guildNavButton} guild-btn`}
        >
          <FontAwesomeIcon
            icon={control.icon}
            className={styles.guildNavIcon}
          />
        </button>
      ))}
    </nav>
  )
}
