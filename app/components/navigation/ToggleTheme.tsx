'use client'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons"
import { useTheme } from "@/app/providers/ThemeProvider"
import styles from "./nav.module.css"

export default function ToggleTheme() {
  const { theme, toggleThemeMode } = useTheme()
  return (
    <div className={styles.toggleSwitch}>
      <input
        type="checkbox"
        id="themeSwitch"
        className={styles.checkbox}
        checked={theme.themeMode === 'dark'}
        onChange={toggleThemeMode}
      />
      <label htmlFor="themeSwitch" className={`${styles.label} themeSwitch`}>
        <FontAwesomeIcon icon={faSun} className={styles.iconSun} />
        <FontAwesomeIcon icon={faMoon} className={styles.iconMoon} />
        <span className={styles.slider}></span>
      </label>
    </div>
  )
}
