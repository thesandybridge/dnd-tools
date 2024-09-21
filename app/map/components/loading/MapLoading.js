import styles from "./loading.module.css"

export default function MapLoading() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.mapSkeleton}>
      </div>
    </div>
  )
}
