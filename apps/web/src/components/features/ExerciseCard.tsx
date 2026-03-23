'use client'

import { useState } from 'react'
import styles from './ExerciseCard.module.css'

interface ExerciseCardProps {
  title: string
  description?: string
  htmlUrl?: string
  evdUrl?: string
}

export default function ExerciseCard({ title, description, htmlUrl, evdUrl }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => htmlUrl && setExpanded(!expanded)}>
        <div className={styles.icon}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20}>
            <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6 7h8M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.info}>
          <h4 className={styles.title}>{title}</h4>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
        <div className={styles.actions}>
          {evdUrl && (
            <a href={evdUrl} download className={styles.downloadBtn} onClick={e => e.stopPropagation()}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                <path d="M8 2v8M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Scarica .evd
            </a>
          )}
          {htmlUrl && (
            <span className={styles.expandIcon} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
      </div>
      {expanded && htmlUrl && (
        <div className={styles.preview}>
          <iframe src={htmlUrl} className={styles.iframe} sandbox="allow-scripts allow-same-origin" />
        </div>
      )}
    </div>
  )
}
