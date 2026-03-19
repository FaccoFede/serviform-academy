import styles from './Shell.module.css'

/**
 * Shell — wrapper principale per il contenuto delle pagine.
 *
 * Applica il padding-top per la topbar e il padding-left per la rail,
 * garantendo che il contenuto non sia coperto dagli elementi fissi.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>
}
