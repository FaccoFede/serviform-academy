// ──────────────────────────────────────────────────────────────────────────────
// PATCH: apps/web/src/app/courses/[slug]/[unit]/page.tsx
//
// Trova questo blocco (riga circa 100-110):
//
//   {data.guide && (
//     <div className={styles.guideSection}>
//       <span className={styles.guideLabel}>Guida di riferimento Zendesk</span>
//       <a href={data.guide.url} target="_blank" rel="noopener" className={styles.guideLink}>
//         → {data.guide.title}
//       </a>
//     </div>
//   )}
//
// E SOSTITUISCILO con questo:
//
//   {/* Guide Zendesk — supporta sia singola (data.guide) che multipla (data.guides) */}
//   {(data.guides?.length > 0 || data.guide) && (
//     <div className={styles.guideSection}>
//       <span className={styles.guideLabel}>
//         {(data.guides?.length || 1) > 1 ? 'Guide di riferimento Zendesk' : 'Guida di riferimento Zendesk'}
//       </span>
//       {(data.guides?.length > 0 ? data.guides : [data.guide]).map((g: any, i: number) => (
//         <a
//           key={g.id || i}
//           href={g.url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className={styles.guideLink}
//           style={{ display: 'flex', marginBottom: 8 }}
//         >
//           <svg viewBox="0 0 14 14" fill="none" width={13} height={13} style={{ marginRight: 6, flexShrink: 0, marginTop: 1 }}>
//             <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
//             <path d="M9 2h5v5M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//           {g.title}
//         </a>
//       ))}
//     </div>
//   )}
//
// ──────────────────────────────────────────────────────────────────────────────
// NOTA IMPORTANTE:
// Il file page.tsx può essere sia page.tsx che UnitPageClient.tsx a seconda
// della versione. Cerca il blocco con data.guide in entrambi i file e applica
// la sostituzione nel file dove compare.
// ──────────────────────────────────────────────────────────────────────────────
