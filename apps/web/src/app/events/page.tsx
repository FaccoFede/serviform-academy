import { api } from '@/lib/api'
import styles from './EventsPage.module.css'

export default async function EventsPage() {
  let upcoming: any[] = []
  let past: any[] = []
  try {
    upcoming = await api.events.findUpcoming()
    past = await api.events.findPast()
  } catch {}

  const typeLabels: Record<string, string> = { WORKSHOP: 'Workshop', WEBINAR: 'Webinar', LIVE_SESSION: 'Sessione live' }
  const typeIcons: Record<string, string> = { WORKSHOP: '🔧', WEBINAR: '📡', LIVE_SESSION: '🎓' }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Eventi e Formazione</h1>
        <p>Workshop, webinar e sessioni live con i formatori Serviform.</p>
      </div>

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Prossimi eventi</h2>
          <div className={styles.grid}>
            {upcoming.map(ev => (
              <div key={ev.id} className={styles.card}>
                <div className={styles.cardType}>{typeIcons[ev.eventType] || '📅'} {typeLabels[ev.eventType] || ev.eventType}</div>
                <h3 className={styles.cardTitle}>{ev.title}</h3>
                {ev.description && <p className={styles.cardDesc}>{ev.description}</p>}
                <div className={styles.cardDate}>
                  <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 7h12M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                {ev.maxSeats && <div className={styles.cardSeats}>{ev.maxSeats} posti disponibili</div>}
                <div className={styles.cardActions}>
                  {ev.registrationUrl ? (
                    <a href={ev.registrationUrl} target="_blank" rel="noopener" className={styles.btnPrimary}>Iscriviti</a>
                  ) : (
                    <a href="mailto:support@serviform.com?subject=Info evento: ${ev.title}" className={styles.btnPrimary}>Iscriviti</a>
                  )}
                  <a href="mailto:support@serviform.com?subject=Info evento: ${ev.title}" className={styles.btnSecondary}>Chiedi info</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Eventi passati</h2>
          <div className={styles.grid}>
            {past.map(ev => (
              <div key={ev.id} className={`${styles.card} ${styles.cardPast}`}>
                <div className={styles.cardType}>{typeLabels[ev.eventType] || ev.eventType}</div>
                <h3 className={styles.cardTitle}>{ev.title}</h3>
                <div className={styles.cardDate}>
                  {new Date(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {ev.recordingUrl && <a href={ev.recordingUrl} target="_blank" rel="noopener" className={styles.btnSecondary}>Guarda la registrazione</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && past.length === 0 && <p className={styles.empty}>Nessun evento in programma. Resta aggiornato!</p>}
    </main>
  )
}
