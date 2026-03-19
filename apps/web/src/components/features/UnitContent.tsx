'use client'

import styles from './UnitContent.module.css'

/**
 * UnitContent — renderizza i contentBlocks JSON di un'unità.
 *
 * Tipi di blocco supportati:
 * - text: titolo + paragrafo
 * - list: titolo + elenco puntato
 * - steps: lista numerata con indicatori
 * - callout: box colorato (red/blue/amber) con titolo e testo
 * - props: griglia di proprietà chiave/valore
 * - image: placeholder per immagini future
 * - objectives: griglia obiettivi di apprendimento
 * - checklist: lista interattiva con checkbox
 */

interface ContentBlock {
  type: string
  title?: string
  content?: string
  items?: any[]
  variant?: string
  caption?: string
}

interface UnitContentProps {
  blocks: ContentBlock[]
  onChecklistChange?: (index: number, checked: boolean) => void
  checkedItems?: Set<number>
}

export default function UnitContent({ blocks, onChecklistChange, checkedItems }: UnitContentProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className={styles.content}>
      {blocks.map((block, i) => (
        <div key={i} className={styles.block}>
          {renderBlock(block, i, onChecklistChange, checkedItems)}
        </div>
      ))}
    </div>
  )
}

function renderBlock(
  block: ContentBlock,
  index: number,
  onChecklistChange?: (index: number, checked: boolean) => void,
  checkedItems?: Set<number>,
) {
  switch (block.type) {
    case 'text':
      return (
        <>
          {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
          <p className={styles.paragraph} dangerouslySetInnerHTML={{ __html: block.content || '' }} />
        </>
      )

    case 'list':
      return (
        <>
          {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
          <ul className={styles.list}>
            {block.items?.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        </>
      )

    case 'steps':
      return (
        <>
          {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
          <ol className={styles.steps}>
            {block.items?.map((item, i) => (
              <li key={i} className={styles.stepItem}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepText} dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ol>
        </>
      )

    case 'callout':
      const icons: Record<string, string> = { red: '⚠️', blue: 'ℹ️', amber: '💡' }
      return (
        <div className={`${styles.callout} ${styles[`callout${block.variant || 'blue'}`]}`}>
          <span className={styles.calloutIcon}>{icons[block.variant || 'blue'] || 'ℹ️'}</span>
          <div>
            {block.title && <div className={styles.calloutTitle}>{block.title}</div>}
            <div className={styles.calloutText} dangerouslySetInnerHTML={{ __html: block.content || '' }} />
          </div>
        </div>
      )

    case 'props':
      return (
        <>
          {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
          <div className={styles.propsGrid}>
            {block.items?.map((prop: any, i: number) => (
              <div key={i} className={styles.propCard}>
                <div className={styles.propName}>{prop.name}</div>
                <div className={styles.propValue}>{prop.value}</div>
              </div>
            ))}
          </div>
        </>
      )

    case 'image':
      return (
        <div className={styles.imagePlaceholder}>
          <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
            <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="11" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 24l8-6 5 4 5-5 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{block.caption || 'Immagine'}</span>
        </div>
      )

    case 'objectives':
      return (
        <>
          <h3 className={styles.objectivesTitle}>Cosa imparerai</h3>
          <div className={styles.objectivesGrid}>
            {block.items?.map((obj, i) => (
              <div key={i} className={styles.objectiveItem}>
                <span className={styles.objectiveBullet}>{i + 1}</span>
                <span className={styles.objectiveText}>{obj}</span>
              </div>
            ))}
          </div>
        </>
      )

    case 'checklist':
      return (
        <>
          <h3 className={styles.blockTitle}>Lista di verifica</h3>
          <div className={styles.checklist}>
            {block.items?.map((item, i) => {
              const checked = checkedItems?.has(i) || false
              return (
                <label key={i} className={`${styles.checkItem} ${checked ? styles.checkItemChecked : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChecklistChange?.(i, e.target.checked)}
                    className={styles.checkBox}
                  />
                  <span>{item}</span>
                </label>
              )
            })}
          </div>
        </>
      )

    default:
      return null
  }
}
