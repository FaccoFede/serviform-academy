import styles from './ProgressBar.module.css'

/**
 * ProgressBar — barra di progresso sottile.
 *
 * Usata nella sidebar del corso e nella topbar globale.
 * Animazione fluida del riempimento.
 */
interface ProgressBarProps {
  percent: number
  label?: string
  showLabel?: boolean
}

export default function ProgressBar({
  percent,
  label,
  showLabel = true,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className={styles.wrap}>
      {showLabel && (
        <div className={styles.labelRow}>
          <span>{label || 'Progresso'}</span>
          <span>{clampedPercent}%</span>
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
}
