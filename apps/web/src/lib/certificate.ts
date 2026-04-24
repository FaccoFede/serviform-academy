/**
 * @file apps/web/src/lib/certificate.ts
 * @description Generazione attestato Serviform Academy.
 *
 * Costruisce un attestato A4 landscape in HTML/CSS e lo apre in una nuova
 * finestra che invoca automaticamente `window.print()`: l'utente può salvarlo
 * come PDF dal dialog di stampa del browser (nessuna libreria PDF richiesta).
 *
 * Il rendering è incapsulato in `buildCertificateHtml` così da poter aggiungere
 * in futuro un esportatore PNG (per social/LinkedIn) riutilizzando lo stesso
 * markup.
 */

import { getBrand } from './brands'
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

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

/** Formatta l'UUID del certificato come "SA-XXXXXXXX-XXXX-XXXX" leggibile. */
function formatCertId(id: string): string {
  const clean = id.replace(/-/g, '').toUpperCase()
  if (clean.length < 16) return `SA-${clean}`
  return `SA-${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`
}

/**
 * Costruisce l'HTML completo dell'attestato.
 * Esportata per riuso (es. futuro rendering PNG).
 */
export function buildCertificateHtml(
  cert: CertificateInput,
  userName: string,
  origin: string,
): string {
  const brand = getBrand(cert.course.software?.slug, cert.course.software ?? undefined)
  const familyColor = brand.color || '#E63329'
  const familyName = brand.name || cert.course.software?.name || 'Serviform'
  const issuedDate = formatDate(cert.issuedAt)
  const prettyId = formatCertId(cert.id)
  const displayName = userName && userName.trim().length > 0 ? userName : 'Utente'
  const level = cert.course.level ? String(cert.course.level) : ''

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<base href="${escapeHtml(origin)}/">
<title>Attestato - ${escapeHtml(cert.course.title)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #EEECE8;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1E1E1E;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 297mm;
    height: 210mm;
    margin: 12mm auto;
    background: #ffffff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  }

  /* ── Cornice esterna ──────────────────────────────────── */
  .outer-border {
    position: absolute;
    inset: 8mm;
    border: 1.4mm solid #1E1E1E;
  }
  .inner-border {
    position: absolute;
    inset: 11mm;
    border: 0.3mm solid #C9C7C2;
  }

  /* ── Accenti di colore ────────────────────────────────── */
  .accent-top {
    position: absolute;
    top: 8mm; left: 8mm; right: 8mm;
    height: 2.5mm;
    background: ${familyColor};
  }
  .accent-bottom {
    position: absolute;
    bottom: 8mm; left: 8mm; right: 8mm;
    height: 5mm;
    background: linear-gradient(90deg, #1E1E1E 0%, #1E1E1E 60%, ${familyColor} 60%, ${familyColor} 100%);
  }

  /* ── Watermark Serviform ──────────────────────────────── */
  .watermark {
    position: absolute;
    bottom: -40mm;
    right: -30mm;
    width: 180mm;
    height: 180mm;
    opacity: 0.04;
    pointer-events: none;
    transform: rotate(-8deg);
  }

  /* ── Contenuto ────────────────────────────────────────── */
  .content {
    position: absolute;
    inset: 18mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .brand-row {
    display: flex;
    align-items: center;
    gap: 10mm;
    margin-top: 2mm;
  }
  .brand-logo {
    width: 18mm;
    height: 18mm;
    flex: 0 0 18mm;
  }
  .brand-text { text-align: left; line-height: 1; }
  .brand-eyebrow {
    font-size: 8pt;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #9D9D9C;
    font-weight: 600;
    margin-bottom: 2mm;
  }
  .brand-name {
    font-size: 22pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #1E1E1E;
  }
  .brand-name .red { color: #E63329; }

  .kind {
    margin-top: 9mm;
    font-size: 9pt;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: ${familyColor};
    font-weight: 700;
  }
  .kind-sep {
    margin-top: 2.5mm;
    height: 0.8mm;
    width: 32mm;
    background: ${familyColor};
  }

  .headline {
    margin-top: 4mm;
    font-size: 30pt;
    font-weight: 800;
    letter-spacing: -1px;
    color: #1E1E1E;
    line-height: 1.1;
  }

  .intro {
    margin-top: 6mm;
    font-size: 12pt;
    color: #6D6C6A;
    font-style: italic;
    letter-spacing: 0.3px;
  }

  .holder {
    margin-top: 3mm;
    font-size: 34pt;
    font-weight: 800;
    color: ${familyColor};
    letter-spacing: -0.8px;
    line-height: 1.1;
    padding: 0 10mm;
  }
  .holder-rule {
    width: 60%;
    max-width: 140mm;
    height: 0.3mm;
    background: #E8E7E4;
    margin: 3mm auto 0;
  }

  .course-intro {
    margin-top: 5mm;
    font-size: 11pt;
    color: #6D6C6A;
  }
  .course-title {
    margin-top: 2mm;
    font-size: 20pt;
    font-weight: 700;
    color: #1E1E1E;
    letter-spacing: -0.3px;
    padding: 0 10mm;
  }

  .meta {
    margin-top: 5mm;
    display: inline-flex;
    align-items: center;
    gap: 5mm;
    padding: 2.5mm 6mm;
    border: 0.3mm solid #E8E7E4;
    border-radius: 999px;
    background: #FBFAF7;
  }
  .meta-item {
    font-family: 'Menlo', 'Courier New', monospace;
    font-size: 8pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #9D9D9C;
  }
  .meta-item b {
    color: #1E1E1E;
    font-weight: 700;
    margin-left: 2mm;
  }
  .meta-dot {
    width: 1mm;
    height: 1mm;
    border-radius: 50%;
    background: #D9D7D2;
  }

  /* ── Footer ───────────────────────────────────────────── */
  .footer {
    position: absolute;
    left: 20mm;
    right: 20mm;
    bottom: 17mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10mm;
  }
  .footer-block {
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
  }
  .footer-block.right { text-align: right; align-items: flex-end; }
  .footer-label {
    font-size: 7pt;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #9D9D9C;
    font-family: 'Menlo', 'Courier New', monospace;
  }
  .footer-value {
    font-size: 10pt;
    font-weight: 700;
    color: #1E1E1E;
    letter-spacing: 0.2px;
  }
  .footer-value.mono {
    font-family: 'Menlo', 'Courier New', monospace;
    letter-spacing: 1px;
  }

  .seal {
    width: 28mm;
    height: 28mm;
    border-radius: 50%;
    border: 0.6mm solid ${familyColor};
    color: ${familyColor};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Menlo', 'Courier New', monospace;
    font-size: 6.5pt;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.3;
    position: relative;
  }
  .seal::before {
    content: '';
    position: absolute;
    inset: 1.2mm;
    border: 0.2mm dashed ${familyColor};
    border-radius: 50%;
  }
  .seal-top { font-weight: 700; font-size: 7pt; }
  .seal-mid { font-size: 10pt; font-weight: 800; margin: 0.5mm 0; letter-spacing: 0.5px; }
  .seal-bot { color: #9D9D9C; font-size: 5.5pt; }

  @media screen {
    body { padding: 20px 0; }
    .print-hint {
      max-width: 297mm;
      margin: 0 auto 12px;
      padding: 10px 16px;
      background: #1E1E1E;
      color: #fff;
      font-size: 13px;
      text-align: center;
      border-radius: 6px;
    }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .page { margin: 0; box-shadow: none; }
    .print-hint { display: none; }
  }
</style>
</head>
<body>
  <div class="print-hint">Salva come PDF dal dialog di stampa. Imposta "A4" orizzontale e rimuovi eventuali intestazioni/pie di pagina.</div>

  <div class="page">
    <div class="outer-border"></div>
    <div class="inner-border"></div>
    <div class="accent-top"></div>
    <div class="accent-bottom"></div>
    <img class="watermark" src="/logo.svg" alt="" aria-hidden="true">

    <div class="content">
      <div class="brand-row">
        <img class="brand-logo" src="/logo.svg" alt="">
        <div class="brand-text">
          <div class="brand-eyebrow">Serviform</div>
          <div class="brand-name">Academy</div>
        </div>
      </div>

      <div class="kind">Attestato ufficiale</div>
      <div class="kind-sep"></div>

      <div class="headline">Attestato di completamento</div>

      <p class="intro">Si certifica che</p>
      <div class="holder">${escapeHtml(displayName)}</div>
      <div class="holder-rule"></div>

      <p class="course-intro">ha completato con successo il modulo formativo</p>
      <div class="course-title">${escapeHtml(cert.course.title)}</div>

      <div class="meta">
        <span class="meta-item">Famiglia <b>${escapeHtml(familyName)}</b></span>
        ${level ? `<span class="meta-dot"></span><span class="meta-item">Livello <b>${escapeHtml(level)}</b></span>` : ''}
      </div>
    </div>

    <div class="footer">
      <div class="footer-block">
        <span class="footer-label">Data di emissione</span>
        <span class="footer-value">${escapeHtml(issuedDate)}</span>
      </div>

      <div class="seal" aria-hidden="true">
        <span class="seal-top">Serviform</span>
        <span class="seal-mid">Academy</span>
        <span class="seal-bot">Certificato</span>
      </div>

      <div class="footer-block right">
        <span class="footer-label">ID attestato</span>
        <span class="footer-value mono">${escapeHtml(prettyId)}</span>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 400);
    });
  </script>
</body>
</html>`
}

/**
 * Apre l'attestato in una nuova finestra e avvia il dialog di stampa per
 * permettere all'utente di salvarlo come PDF (formato A4 landscape).
 *
 * Se il popup viene bloccato, fa fallback su un Blob URL aperto nel tab
 * corrente (in questo caso il print va avviato manualmente).
 */
export function downloadCertificateA4(cert: CertificateInput, userName: string): void {
  if (typeof window === 'undefined') return
  const origin = window.location.origin
  const html = buildCertificateHtml(cert, userName, origin)

  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return
  }

  // Fallback: popup bloccato → apri come blob
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
