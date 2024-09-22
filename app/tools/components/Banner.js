import styles from "./banner.module.css"

export default function Banner({ image, children }) {
  return (
    <div
      className={styles.banner}
      style={{
        backgroundImage: `url(${image})`
      }}
    >
      <div className={styles.children}>
        {children}
      </div>
    </div >
  )
}
