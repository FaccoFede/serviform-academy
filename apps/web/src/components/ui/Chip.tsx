'use client'

import styles from './Chip.module.css'

/**
 * Chip — bottone filtro per selezionare un software.
 *
 * Mostra un pallino colorato e il nome del software.
 * Lo stato "active" evidenzia il chip selezionato.
 */
interface ChipProps {
  label: string
  active?: boolean
  color?: string
  onClick?: () => void
}

export default function Chip({ label, active = false, color, onClick }: ChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      {color && (
        <span className={styles.dot} style={{ background: color }} />
      )}
      {label}
    </button>
  )
}
