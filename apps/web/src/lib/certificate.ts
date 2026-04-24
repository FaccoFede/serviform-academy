/**
 * @file apps/web/src/lib/certificate.ts
 * @description Generazione attestato Serviform Academy.
 *
 * Usa jsPDF per produrre un PDF A4 landscape scaricato automaticamente dal
 * browser. Palette: rosso Serviform (#E63329) come colore primario su fondo
 * bianco; nessun colore di famiglia né nero pieno.
 */

import jsPDF from 'jspdf'
import { formatDate } from './formatters'

export interface CertificateInput {
  id: string
  issuedAt: string
  course: {
    id?: string
    title: string
    slug: string
    level?: string | null
    software?: {
      slug: string
      name: string
      color?: string | null
      lightColor?: string | null
    } | null
  }
}

const RED: [number, number, number] = [230, 51, 41]        // #E63329
const INK: [number, number, number] = [42, 42, 42]         // antracite (non nero puro)
const MUTED: [number, number, number] = [140, 140, 140]
const HAIRLINE: [number, number, number] = [230, 228, 222]

/** Formatta l'UUID come SA-XXXXXXXX-XXXX-XXXX. */
function formatCertId(id: string): string {
  const clean = id.replace(/-/g, '').toUpperCase()
  if (clean.length < 16) return `SA-${clean}`
  return `SA-${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`
}

/** Carica un SVG e lo converte in PNG data URL dimensionato a `px`. */
function loadLogoPng(url: string, px: number): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = px
      canvas.height = px
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, px, px)
      try { resolve(canvas.toDataURL('image/png')) } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Genera e scarica l'attestato come PDF A4 landscape.
 * Il file viene salvato automaticamente dal browser.
 */
export async function downloadCertificateA4(
  cert: CertificateInput,
  userName: string,
): Promise<void> {
  if (typeof window === 'undefined') return

  const displayName = userName && userName.trim().length > 0 ? userName.trim() : 'Utente'
  const issuedDate = formatDate(cert.issuedAt)
  const prettyId = formatCertId(cert.id)
  const familyName = cert.course.software?.name || 'Serviform'
  const level = cert.course.level ? String(cert.course.level).trim() : ''
  const badgeLine = level ? `${familyName} — ${level}` : familyName

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210

  // ── Cornice rossa (esterna + filetto interno) ────────────
  doc.setDrawColor(...RED)
  doc.setLineWidth(1.6)
  doc.rect(8, 8, W - 16, H - 16)
  doc.setLineWidth(0.2)
  doc.rect(11, 11, W - 22, H - 22)

  // ── Accenti decorativi rossi (alto + basso) ──────────────
  doc.setFillColor(...RED)
  doc.rect(8, 8, W - 16, 2.5, 'F')
  doc.rect(8, H - 10.5, W - 16, 2.5, 'F')

  // ── Logo + "Serviform Academy" (stesso font e grandezza) ─
  const logoData = await loadLogoPng('/logo.svg', 256)
  const brandText = 'Serviform Academy'
  const brandFontSize = 20
  const logoSize = 13
  const gap = 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(brandFontSize)
  doc.setTextColor(...INK)
  const brandWidth = doc.getTextWidth(brandText)
  const totalW = logoSize + gap + brandWidth
  const startX = (W - totalW) / 2
  const brandTopY = 24
  if (logoData) {
    doc.addImage(logoData, 'PNG', startX, brandTopY, logoSize, logoSize)
  }
  doc.text(brandText, startX + logoSize + gap, brandTopY + logoSize * 0.72)

  // ── Sottolineatura rossa minimal ─────────────────────────
  doc.setDrawColor(...RED)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 16, 46, W / 2 + 16, 46)

  // ── Titolo attestato (unico) ─────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...INK)
  doc.text('Attestato di completamento', W / 2, 66, { align: 'center' })

  // ── "Si certifica che" ───────────────────────────────────
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(13)
  doc.setTextColor(...MUTED)
  doc.text('Si certifica che', W / 2, 86, { align: 'center' })

  // ── Nome utente (rosso, grande) ──────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(...RED)
  doc.text(displayName, W / 2, 108, { align: 'center' })

  // ── Filetto sotto al nome ────────────────────────────────
  doc.setDrawColor(...HAIRLINE)
  doc.setLineWidth(0.2)
  doc.line(W / 2 - 70, 115, W / 2 + 70, 115)

  // ── Testo completamento ──────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text(
    'ha completato con successo il modulo formativo',
    W / 2,
    127,
    { align: 'center' },
  )

  // ── Titolo corso ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...INK)
  doc.text(cert.course.title, W / 2, 142, { align: 'center' })

  // ── Software — Livello (testo semplice, senza bordi) ─────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  doc.text(badgeLine, W / 2, 152, { align: 'center' })

  // ── Footer: data a sx, id a dx ───────────────────────────
  doc.setDrawColor(...RED)
  doc.setLineWidth(0.3)
  doc.line(22, 180, W - 22, 180)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('DATA DI EMISSIONE', 22, 186)
  doc.text('ID ATTESTATO', W - 22, 186, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(issuedDate, 22, 192)
  doc.text(prettyId, W - 22, 192, { align: 'right' })

  // ── Download automatico ──────────────────────────────────
  doc.save(`attestato-${cert.course.slug}-${cert.id.slice(0, 8)}.pdf`)
}
