// PATCH da applicare a apps/web/src/app/courses/[slug]/[unit]/page.tsx
//
// La pagina unità mostra attualmente una sola guida (data.guide).
// Con la nuova struttura 1:N, le guide arrivano come data.guides (array).
//
// Trova il blocco che renderizza la guida Zendesk nel JSX, che assomiglia a:
//
//   {data.guide && (
//     <div className={styles.guideSection}>
//       <span className={styles.guideLabel}>Guida di riferimento</span>
//       <a href={data.guide.url} ...>{data.guide.title}</a>
//     </div>
//   )}
//
// Sostituiscilo con questo (supporta array di guide):
//
//   {(data.guides?.length > 0 || data.guide) && (
//     <div className={styles.guideSection}>
//       <span className={styles.guideLabel}>
//         {(data.guides?.length || 1) > 1 ? 'Guide di riferimento' : 'Guida di riferimento'}
//       </span>
//       {/* Supporta sia il vecchio campo guide (singolo) che il nuovo guides (array) */}
//       {(data.guides?.length > 0 ? data.guides : [data.guide]).map((g: any) => (
//         <a
//           key={g.id}
//           href={g.url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className={styles.guideLink}
//         >
//           <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
//             <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
//             <path d="M9 2h5v5M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//           {g.title}
//         </a>
//       ))}
//     </div>
//   )}
//
// Nota: il backend ora restituisce `guides` (array) nell'endpoint
// GET /units/:courseSlug/:unitSlug — assicurati che il service includa le guide.
