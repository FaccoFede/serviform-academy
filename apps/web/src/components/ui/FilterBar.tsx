'use client'

import { useState } from 'react'
import Chip from './Chip'
import styles from './FilterBar.module.css'

/**
 * FilterBar — barra filtri sticky sotto la hero.
 *
 * Mostra chip per filtrare i corsi per software.
 * Il chip "Tutti" resetta il filtro.
 * Notifica il parent del filtro selezionato tramite onChange.
 */

interface FilterOption {
  label: string
  value: string | null
  color?: string
}

interface FilterBarProps {
  options: FilterOption[]
  onChange: (value: string | null) => void
}

export default function FilterBar({ options, onChange }: FilterBarProps) {
  const [active, setActive] = useState<string | null>(null)

  function handleClick(value: string | null) {
    setActive(value)
    onChange(value)
  }

  return (
    <div className={styles.bar}>
      <span className={styles.label}>Filtra</span>

      <Chip
        label="Tutti"
        active={active === null}
        onClick={() => handleClick(null)}
      />

      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          color={opt.color}
          active={active === opt.value}
          onClick={() => handleClick(opt.value)}
        />
      ))}
    </div>
  )
}
