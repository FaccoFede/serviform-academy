import { getBrand } from '@/lib/brands'
import styles from './SoftwareTag.module.css'

/**
 * SoftwareTag — badge colorato per indicare il software.
 *
 * Mostra il nome del software (EngView, Sysform, ProjectO)
 * con i colori del brand corrispondente.
 *
 * Props:
 * - slug: slug del software per determinare i colori
 * - size: dimensione del tag ('sm' o 'md')
 */
interface SoftwareTagProps {
  slug: string
  size?: 'sm' | 'md'
}

export default function SoftwareTag({ slug, size = 'md' }: SoftwareTagProps) {
  const brand = getBrand(slug)

  return (
    <span
      className={`${styles.tag} ${size === 'sm' ? styles.sm : ''}`}
      style={{
        background: brand.light,
        color: brand.color,
      }}
    >
      {brand.name}
    </span>
  )
}
