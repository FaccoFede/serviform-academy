import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Serviform Academy v2...')

  // Software with updated colors (Sysform = RED)
  const engview = await prisma.software.upsert({ where: { slug: 'engview' }, update: { tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875', lightColor: '#EEF3FA' }, create: { name: 'EngView', slug: 'engview', tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875', lightColor: '#EEF3FA' } })
  const sysform = await prisma.software.upsert({ where: { slug: 'sysform' }, update: { tagline: 'Gestione e ottimizzazione della produzione', color: '#C8102E', lightColor: '#FDF0EF' }, create: { name: 'Sysform', slug: 'sysform', tagline: 'Gestione e ottimizzazione della produzione', color: '#C8102E', lightColor: '#FDF0EF' } })
  const projecto = await prisma.software.upsert({ where: { slug: 'projecto' }, update: { tagline: 'Project management e workflow creativo', color: '#067DB8', lightColor: '#E3F4FC' }, create: { name: 'ProjectO', slug: 'projecto', tagline: 'Project management e workflow creativo', color: '#067DB8', lightColor: '#E3F4FC' } })
  console.log('  ✓ Software (Sysform now RED)')

  // Courses
  const coursesData = [
    { title: 'Modulo 3D', slug: 'engview-3d', description: 'Trasforma i disegni strutturali 2D in modelli tridimensionali interattivi e simula il montaggio del packaging.', softwareId: engview.id, level: 'Intermedio', duration: '3h 30m', available: true },
    { title: 'Modulo 2D', slug: 'engview-2d', description: 'Crea e gestisci disegni strutturali per packaging con gli strumenti di progettazione 2D.', softwareId: engview.id, level: 'Base', duration: '2h 00m', available: false },
    { title: 'Nesting e Ottimizzazione', slug: 'engview-nesting', description: 'Massimizza il rendimento del foglio con gli strumenti di nesting automatico e semi-automatico.', softwareId: engview.id, level: 'Avanzato', duration: '1h 45m', available: false },
    { title: 'Sysform Introduzione', slug: 'sysform-base', description: 'Panoramica completa del sistema Sysform per la gestione del processo produttivo.', softwareId: sysform.id, level: 'Base', duration: '2h 00m', available: false },
    { title: 'ProjectO Primi passi', slug: 'projecto-start', description: 'Configura il tuo spazio di lavoro e gestisci i primi progetti con ProjectO.', softwareId: projecto.id, level: 'Base', duration: '1h 30m', available: false },
  ]
  for (const c of coursesData) {
    await prisma.course.upsert({ where: { slug: c.slug }, update: { level: c.level, duration: c.duration, available: c.available }, create: c })
  }
  console.log('  ✓ Corsi')

  // Units with rich HTML content
  const engview3d = await prisma.course.findUnique({ where: { slug: 'engview-3d' } })
  if (engview3d) {
    const units = [
      { title: 'Panoramica del Modulo', slug: 'panoramica', order: 1, subtitle: 'Obiettivi, struttura e prerequisiti', duration: '5 min', unitType: 'OVERVIEW', content: '<h3>Introduzione</h3><p>Il modulo 3D di EngView consente di trasformare un disegno strutturale realizzato nell\'ambiente 2D in un modello tridimensionale interattivo.</p><h3>Cosa imparerai</h3><ul><li>Generare il modello 3D a partire da un disegno strutturale 2D</li><li>Comprendere la sequenza di animazione (Fasi, Passi, Azioni)</li><li>Creare una simulazione del montaggio</li><li>Applicare azioni di piega alle superfici</li><li>Inserire oggetti 3D e configurarne proprietà</li><li>Esportare il modello 3D in formato HTML</li></ul>' },
      { title: 'Struttura dell\'ambiente 3D', slug: 'struttura-ambiente-3d', order: 2, subtitle: 'Fasi, Passi e Azioni', duration: '15 min', unitType: 'LESSON', content: '<h3>L\'area tabellare</h3><p>L\'ambiente 3D contiene un\'area tabellare che gestisce la sequenza di animazione del modello.</p><h3>I tre livelli principali</h3><ul><li><strong>Fasi</strong> — i momenti principali del montaggio</li><li><strong>Passi</strong> — momenti temporali all\'interno di una fase</li><li><strong>Azioni</strong> — i processi applicati alle superfici</li></ul><div class="callout callout-red"><strong>NOTA</strong>: Creare più fasi è fondamentale per l\'esportazione e l\'Assembly display.</div>' },
      { title: 'Ricostruzione manuale della sequenza', slug: 'ricostruzione-sequenza', order: 3, subtitle: 'Eliminare e ricostruire passo per passo', duration: '20 min', unitType: 'LESSON', content: '<h3>Perché farlo manualmente</h3><p>Eliminare la sequenza generata automaticamente e ricostruirla a mano consolida la comprensione dei tre livelli.</p><h3>Procedura</h3><ol><li>Eliminare la fase esistente generata automaticamente</li><li>Creare una nuova fase con nome descrittivo</li><li>Creare i passi all\'interno della fase</li><li>Applicare le azioni di piega</li></ol>' },
      { title: 'Applicazione delle azioni di piega', slug: 'azioni-piega', order: 4, subtitle: 'Angoli assoluti e sequenze di movimento', duration: '25 min', unitType: 'LESSON', content: '<h3>Le azioni di piega</h3><p>Le azioni definiscono i movimenti applicati alle superfici durante l\'animazione.</p><div class="callout callout-blue"><strong>CONCETTO — Angolo assoluto</strong>: L\'angolo impostato è un valore ASSOLUTO: definisce la posizione finale della superficie.</div>' },
      { title: 'Selezione della superficie di base', slug: 'superficie-base', order: 5, subtitle: 'Il piano di riferimento del modello', duration: '15 min', unitType: 'LESSON', content: '<h3>La superficie di base</h3><p>La superficie di base è il pannello di riferimento del modello 3D.</p><div class="callout callout-amber"><strong>IMPORTANTE</strong>: Scegliere correttamente la superficie di base è fondamentale. Una scelta errata comprometterà l\'intera sequenza.</div>' },
      { title: 'Inserimento oggetti 3D', slug: 'oggetto-3d', order: 6, subtitle: 'Aggiungere prodotti nella simulazione', duration: '25 min', unitType: 'LESSON', content: '<h3>Oggetti 3D nel packaging</h3><p>EngView permette di inserire oggetti tridimensionali nella simulazione per rappresentare il prodotto contenuto nella confezione.</p><ol><li>Accedere al menu Inserisci → Oggetto 3D</li><li>Selezionare il tipo dalla libreria</li><li>Posizionare l\'oggetto nel modello</li><li>Configurare dimensioni e proprietà</li></ol>' },
      { title: 'Proprietà e allineamento', slug: 'allineamento-3d', order: 7, subtitle: 'Posizione, rotazione e ancoraggio', duration: '20 min', unitType: 'LESSON', content: '<h3>Il pannello proprietà</h3><p>Ogni oggetto 3D ha un pannello che ne gestisce posizionamento, rotazione e allineamento.</p>' },
      { title: 'Array di ripetizione', slug: 'array-ripetizione', order: 8, subtitle: 'Duplicare oggetti per display multipli', duration: '20 min', unitType: 'LESSON', content: '<h3>Array di ripetizione</h3><p>Permette di duplicare un oggetto 3D secondo un pattern regolare per simulare display con più prodotti.</p>' },
      { title: 'Quote 3D', slug: 'quote-3d', order: 9, subtitle: 'Verifica dimensionale con spessore', duration: '15 min', unitType: 'LESSON', content: '<h3>Quote tridimensionali</h3><p>Le quote 3D verificano le dimensioni effettive del modello includendo lo spessore del materiale.</p>' },
      { title: 'Opzioni di rappresentazione', slug: 'rappresentazione', order: 10, subtitle: 'Sfondo, illuminazione e HDR', duration: '15 min', unitType: 'LESSON', content: '<h3>Personalizzazione visiva</h3><p>EngView offre diverse opzioni per personalizzare l\'aspetto del modello 3D: sfondi, illuminazione, file HDR per presentazioni professionali.</p>' },
      { title: 'Esercitazione finale', slug: 'esercitazione-finale', order: 11, subtitle: 'Workflow completo dal 2D al 3D', duration: '30 min', unitType: 'EXERCISE', content: '<h3>Esercitazione pratica</h3><p>Metti in pratica tutto ciò che hai appreso seguendo il workflow completo dalla struttura 2D alla simulazione 3D esportabile.</p><p>Completa le esercitazioni qui sotto per ottenere l\'attestato di partecipazione al modulo.</p>' },
    ]

    const ZD = [
      null,
      { zendeskId: '29828766274194', title: 'Fase: Creazione e modifica', url: 'https://support.serviform.com/hc/it/articles/29828766274194' },
      { zendeskId: '29837509141010', title: 'Passo: Creazione e modifica', url: 'https://support.serviform.com/hc/it/articles/29837509141010' },
      { zendeskId: '29838651936146', title: 'Azioni: Tipologie e creazione', url: 'https://support.serviform.com/hc/it/articles/29838651936146' },
      { zendeskId: '29735425893138', title: 'Selezionare superficie di base', url: 'https://support.serviform.com/hc/it/articles/29735425893138' },
      { zendeskId: '29889268773522', title: 'Inserimento di un oggetto 3D', url: 'https://support.serviform.com/hc/it/articles/29889268773522' },
      { zendeskId: '29897017185938', title: 'Proprietà oggetto 3D: Allineamento', url: 'https://support.serviform.com/hc/it/articles/29897017185938' },
      { zendeskId: '29912348857618', title: 'Array di ripetizione', url: 'https://support.serviform.com/hc/it/articles/29912348857618' },
      { zendeskId: '29951617666194', title: 'Quote 3D', url: 'https://support.serviform.com/hc/it/articles/29951617666194' },
      { zendeskId: '29680466199058', title: 'Opzioni di rappresentazione 3D', url: 'https://support.serviform.com/hc/it/articles/29680466199058' },
      null,
    ]

    for (let i = 0; i < units.length; i++) {
      const u = units[i]
      const existing = await prisma.unit.findFirst({ where: { courseId: engview3d.id, slug: u.slug } })
      let unitId: string
      if (existing) {
        await prisma.unit.update({ where: { id: existing.id }, data: { subtitle: u.subtitle, duration: u.duration, unitType: u.unitType as any, content: u.content } })
        unitId = existing.id
      } else {
        const created = await prisma.unit.create({ data: { ...u, courseId: engview3d.id } as any })
        unitId = created.id
      }
      if (ZD[i]) {
        const existingGuide = await prisma.guideReference.findUnique({ where: { unitId } })
        if (!existingGuide) await prisma.guideReference.create({ data: { ...ZD[i]!, unitId } })
      }
    }
    console.log('  ✓ Unità con contenuto HTML e guide Zendesk')

    // Exercises for the final unit
    const exUnit = await prisma.unit.findFirst({ where: { courseId: engview3d.id, slug: 'esercitazione-finale' } })
    if (exUnit) {
      const exercises = [
        { title: 'Astuccio con chiusura a incastro', description: 'Crea il modello 3D di un astuccio con chiusura a incastro, simula il montaggio completo e esporta in HTML.', order: 1, unitId: exUnit.id },
        { title: 'Scatola con fondo automatico', description: 'Realizza una scatola con fondo automatico (auto-lock bottom), gestisci le fasi di piega e inserisci il prodotto.', order: 2, unitId: exUnit.id },
        { title: 'Display espositore con ripetizione', description: 'Progetta un display espositore con array di prodotti ripetuti e personalizza la rappresentazione visiva.', order: 3, unitId: exUnit.id },
      ]
      for (const ex of exercises) {
        const existing = await prisma.exercise.findFirst({ where: { unitId: exUnit.id, title: ex.title } })
        if (!existing) await prisma.exercise.create({ data: ex })
      }
      console.log('  ✓ Esercitazioni')
    }
  }

  // Video pills
  const pills = [
    { title: 'Introduzione al modulo 3D', youtubeId: 'zt4aT5oKLII', description: 'Trasforma un disegno 2D in modello 3D interattivo.', softwareId: engview.id },
    { title: 'Fasi, Passi e Azioni', youtubeId: 'kqFPxe_E7WI', description: 'Struttura gerarchica dell\'animazione.', softwareId: engview.id },
    { title: 'Azioni di piega nel 3D', youtubeId: '8qhtL4Rv0gI', description: 'Angoli assoluti e piegature realistiche.', softwareId: engview.id },
    { title: 'Inserire oggetti 3D', youtubeId: 'pQlUjW3xhes', description: 'Inserimento oggetti prodotto nella simulazione.', softwareId: engview.id },
    { title: 'Array di ripetizione', youtubeId: '1ybZCklt4Bg', description: 'Duplica oggetti per display multipli.', softwareId: engview.id },
    { title: 'Quote 3D e verifica', youtubeId: 'bd2mps58Flo', description: 'Misura dimensioni con spessore materiale.', softwareId: engview.id },
    { title: 'Rappresentazione visiva', youtubeId: 'N1K1haAkC_M', description: 'Sfondo, illuminazione e HDR.', softwareId: engview.id },
    { title: 'Esportazione HTML', youtubeId: 'BF8az5d9418', description: 'Condividi senza EngView installato.', softwareId: engview.id },
    { title: 'Workflow completo 2D→3D', youtubeId: '-69Uk74NXtU', description: 'Esercitazione end-to-end.', softwareId: engview.id },
  ]
  for (const p of pills) { await prisma.videoPill.upsert({ where: { youtubeId: p.youtubeId }, update: {}, create: p }) }
  console.log('  ✓ Video pillole')

  // Pricing packages
  const packages = [
    { name: 'Modulo Singolo', slug: 'modulo-singolo', description: 'Accesso a un modulo specifico in autonomia', price: '€ 149', priceNote: 'per modulo', features: ['Accesso completo al modulo scelto', 'Esercitazioni con file .evd', 'Guide Zendesk collegate', 'Attestato di partecipazione'], order: 1 },
    { name: 'Modulo con Formatore', slug: 'modulo-formatore', description: 'Modulo + sessione live con formatore dedicato', price: '€ 449', priceNote: 'per modulo + 4h formatore', features: ['Tutto del Modulo Singolo', 'Sessione live con formatore', '4 ore di formazione dedicata', 'Supporto post-sessione'], highlighted: true, order: 2 },
    { name: 'Corso Completo', slug: 'corso-completo', description: 'Tutti i moduli di un software', price: '€ 349', priceNote: 'per software', features: ['Tutti i moduli del software scelto', 'Esercitazioni complete', 'Attestato per ogni modulo', 'Attestato corso completo'], order: 3 },
    { name: 'Consulenza Oraria', slug: 'consulenza-oraria', description: 'Ore di consulenza one-to-one', price: '€ 120', priceNote: 'per ora', features: ['Formatore dedicato', 'Analisi sui tuoi file', 'Troubleshooting personalizzato', 'Report di sessione'], order: 4 },
    { name: 'Enterprise', slug: 'enterprise', description: 'Pacchetto personalizzato per team e aziende', price: 'Su misura', features: ['Tutti i corsi per il team', 'Formazione personalizzata', 'Dashboard progresso team', 'Account manager dedicato', 'SLA garantito'], order: 5 },
  ]
  for (const pkg of packages) { await prisma.pricingPackage.upsert({ where: { slug: pkg.slug }, update: { ...pkg }, create: pkg }) }
  console.log('  ✓ Pacchetti listino')

  // Events
  const events = [
    { title: 'Workshop: Modulo 3D EngView', description: 'Workshop pratico di 4 ore sul modulo 3D di EngView. Dalla struttura 2D alla simulazione esportabile.', eventType: 'WORKSHOP' as any, date: new Date('2026-04-15T09:00:00Z'), endDate: new Date('2026-04-15T13:00:00Z'), location: 'Online (Zoom)', maxSeats: 20 },
    { title: 'Webinar: Novità EngView 2026', description: 'Presentazione delle nuove funzionalità di EngView rilasciate nel 2026.', eventType: 'WEBINAR' as any, date: new Date('2026-04-22T14:00:00Z'), endDate: new Date('2026-04-22T15:00:00Z'), location: 'Online', maxSeats: 100 },
    { title: 'Sessione live: Q&A Sysform', description: 'Sessione di domande e risposte aperta su Sysform con il team di formazione.', eventType: 'LIVE_SESSION' as any, date: new Date('2026-05-06T10:00:00Z'), location: 'Online', maxSeats: 50 },
  ]
  for (const ev of events) { await prisma.event.create({ data: ev }).catch(() => {}) }
  console.log('  ✓ Eventi')

  console.log('✅ Seed v2 completo!')
}

main().catch(e => { console.error('❌', e); process.exit(1) }).finally(() => prisma.$disconnect())
