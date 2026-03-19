import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

/**
 * Seed completo — popola il database con tutti i dati del prototipo HTML v6.3.
 *
 * Include:
 * - 3 software con colori e tagline
 * - 5 corsi con livello, durata, disponibilità
 * - 11 unità con contentBlocks JSON strutturati
 * - 9 video pillole con YouTube ID reali
 * - 12 guide Zendesk con URL reali
 * - 1 utente admin di default
 */

const prisma = new PrismaClient()

// ─── Zendesk guides ─────────────────────────────
const ZD_GUIDES = [
  { zendeskId: '29828766274194', title: 'Fase: Creazione e modifica', url: 'https://support.serviform.com/hc/it/articles/29828766274194' },
  { zendeskId: '29837509141010', title: 'Passo: Creazione e modifica', url: 'https://support.serviform.com/hc/it/articles/29837509141010' },
  { zendeskId: '29838651936146', title: 'Azioni: Tipologie e creazione', url: 'https://support.serviform.com/hc/it/articles/29838651936146' },
  { zendeskId: '29735425893138', title: 'Selezionare superficie di base', url: 'https://support.serviform.com/hc/it/articles/29735425893138' },
  { zendeskId: '29854715707154', title: 'Azioni: Inserisci vista', url: 'https://support.serviform.com/hc/it/articles/29854715707154' },
  { zendeskId: '29889268773522', title: 'Inserimento di un oggetto 3D', url: 'https://support.serviform.com/hc/it/articles/29889268773522' },
  { zendeskId: '29897017185938', title: 'Proprietà oggetto 3D: Allineamento', url: 'https://support.serviform.com/hc/it/articles/29897017185938' },
  { zendeskId: '29912348857618', title: 'Array di ripetizione', url: 'https://support.serviform.com/hc/it/articles/29912348857618' },
  { zendeskId: '29951617666194', title: 'Quote 3D', url: 'https://support.serviform.com/hc/it/articles/29951617666194' },
  { zendeskId: '29680466199058', title: 'Opzioni di rappresentazione 3D', url: 'https://support.serviform.com/hc/it/articles/29680466199058' },
  { zendeskId: '29155102352402', title: 'Esportazione di un modello 3D', url: 'https://support.serviform.com/hc/it/articles/29155102352402' },
  { zendeskId: '29155072637458', title: 'Formati di esportazione avanzati', url: 'https://support.serviform.com/hc/it/articles/29155072637458' },
]

// ─── Unit content blocks ────────────────────────
const UNIT_CONTENT: Record<string, { subtitle: string; duration: string; unitType: string; contentBlocks: object[] }> = {
  'panoramica': {
    subtitle: 'Obiettivi, struttura e prerequisiti del corso',
    duration: '5 min',
    unitType: 'OVERVIEW',
    contentBlocks: [
      { type: 'text', title: 'Introduzione', content: 'Il modulo 3D di EngView consente di trasformare un disegno strutturale realizzato nell\'ambiente 2D in un modello tridimensionale interattivo, permettendo di analizzare il comportamento della struttura durante le diverse fasi di montaggio.' },
      { type: 'objectives', items: [
        'Generare il modello 3D a partire da un disegno strutturale 2D',
        'Comprendere e gestire la sequenza di animazione (Fasi, Passi, Azioni)',
        'Creare una simulazione del montaggio della struttura',
        'Applicare azioni di piega alle superfici del modello',
        'Inserire oggetti 3D e configurarne proprietà e dimensioni',
        'Inserire quote tridimensionali per verifiche dimensionali',
        'Esportare il modello 3D in formato HTML condivisibile',
      ]},
    ],
  },
  'struttura-ambiente-3d': {
    subtitle: 'Fasi, Passi e Azioni — i tre livelli della sequenza di animazione',
    duration: '15 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'L\'area tabellare', content: 'L\'ambiente 3D contiene un\'area tabellare che gestisce la sequenza di animazione del modello. Questa area permette di controllare ogni movimento della struttura durante la simulazione ed è il fulcro del lavoro tridimensionale.' },
      { type: 'list', title: 'I tre livelli principali', items: [
        '<strong>Fasi</strong> — i momenti principali del montaggio (es. Messa in volume, Chiusura fondo, Chiusura coperchio)',
        '<strong>Passi</strong> — momenti temporali all\'interno di una fase che permettono di separare le azioni',
        '<strong>Azioni</strong> — i processi applicati alle superfici del modello tridimensionale',
      ]},
      { type: 'callout', variant: 'red', title: 'NOTA — Esportazione e Assembly', content: 'Creare più fasi è fondamentale: per l\'Esportazione si definisce da quale fase a quale fase esportare; per l\'Assembly display viene richiesto di indicare la fase nella quale visualizzare il componente 3D.' },
      { type: 'image', caption: 'Diagramma: Sequenza → Fasi → Passi → Azioni' },
    ],
  },
  'ricostruzione-sequenza': {
    subtitle: 'Eliminare la sequenza automatica e ricostruirla passo per passo',
    duration: '20 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Perché farlo manualmente', content: 'Eliminare la sequenza generata automaticamente e ricostruirla a mano consolida la comprensione dei tre livelli e permette un controllo preciso della simulazione di montaggio.' },
      { type: 'steps', items: [
        'Eliminare la fase esistente generata automaticamente',
        'Creare una nuova fase e assegnarle un nome descrittivo',
        'Creare i passi all\'interno della fase',
        'Applicare le azioni di piega alle superfici desiderate',
      ]},
      { type: 'list', title: 'Esempio di sequenza per una scatola standard', items: [
        'Fase 1 → Messa in volume',
        'Fase 2 → Chiusura fondo',
        'Fase 3 → Chiusura coperchio',
      ]},
    ],
  },
  'azioni-piega': {
    subtitle: 'Angoli assoluti e sequenze di movimento superfici',
    duration: '25 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Le azioni di piega', content: 'Le azioni definiscono i movimenti applicati alle superfici durante l\'animazione. L\'azione principale nel packaging è la piega, che simula il ripiegamento fisico di un pannello del cartone.' },
      { type: 'callout', variant: 'blue', title: 'CONCETTO — Angolo assoluto', content: 'L\'angolo impostato è un valore ASSOLUTO: definisce la posizione finale della superficie, non lo spostamento relativo. Un valore di 90° porterà sempre la superficie a 90° indipendentemente dalla posizione di partenza.' },
      { type: 'text', title: 'Costruire l\'animazione', content: 'È possibile applicare pieghe a diverse superfici in passi differenti per simulare correttamente il montaggio. Ogni passo può contenere più azioni che avvengono simultaneamente.' },
    ],
  },
  'superficie-base': {
    subtitle: 'Identificare e impostare il piano di riferimento del modello',
    duration: '15 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'La superficie di base', content: 'La superficie di base è il pannello di riferimento del modello 3D — il punto fisso attorno al quale vengono costruite tutte le pieghe e i movimenti dell\'animazione.' },
      { type: 'callout', variant: 'amber', title: 'IMPORTANTE', content: 'Scegliere correttamente la superficie di base è fondamentale. Una scelta errata comprometterà l\'intera sequenza di animazione e renderà difficile la correzione successiva.' },
      { type: 'props', items: [
        { name: 'Funzione', value: 'Piano di riferimento fisso' },
        { name: 'Impatto', value: 'Tutta la sequenza di animazione' },
        { name: 'Modificabile', value: 'Sì, ma con cautela' },
        { name: 'Consiglio', value: 'Usare il pannello più grande' },
      ]},
    ],
  },
  'inserisci-vista': {
    subtitle: 'Aggiungere viste del modello alla sequenza di animazione',
    duration: '20 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Cos\'è una vista', content: 'L\'azione \'Inserisci Vista\' permette di aggiungere alla sequenza di animazione una fotografia istantanea della posizione corrente del modello. Ogni fase può contenere una o più viste.' },
      { type: 'steps', items: [
        'Posizionare il modello nella configurazione desiderata',
        'Selezionare il passo nella sequenza dove inserire la vista',
        'Usare il comando \'Inserisci Vista\' dal menu azioni',
        'Rinominare la vista con un nome descrittivo',
      ]},
      { type: 'callout', variant: 'blue', title: 'BEST PRACTICE', content: 'Nominare le viste in modo descrittivo (es. \'Volume aperto\', \'Fondo chiuso\') facilita la navigazione e la modifica successiva della sequenza.' },
    ],
  },
  'oggetto-3d': {
    subtitle: 'Aggiungere prodotti e oggetti nella simulazione',
    duration: '25 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Oggetti 3D nel packaging', content: 'EngView permette di inserire oggetti tridimensionali nella simulazione per rappresentare il prodotto contenuto nella confezione. Questo rende la visualizzazione più realistica e comunicativa.' },
      { type: 'steps', items: [
        'Accedere al menu Inserisci → Oggetto 3D',
        'Selezionare il tipo di oggetto dalla libreria (parallelepipedo, cilindro, oggetto personalizzato)',
        'Posizionare l\'oggetto nel modello',
        'Configurare dimensioni e proprietà nell\'apposito pannello',
      ]},
      { type: 'callout', variant: 'red', title: 'NOTA — Fase di visualizzazione', content: 'Al momento dell\'inserimento viene chiesto di specificare da quale fase l\'oggetto deve essere visibile. Questo è fondamentale per una corretta animazione.' },
    ],
  },
  'allineamento-3d': {
    subtitle: 'Configurare posizione, rotazione e ancoraggio degli oggetti',
    duration: '20 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Il pannello proprietà', content: 'Ogni oggetto 3D inserito nel modello ha un pannello proprietà che ne gestisce il posizionamento esatto, la rotazione nei tre assi e l\'allineamento rispetto alle superfici della confezione.' },
      { type: 'props', items: [
        { name: 'Posizione X/Y/Z', value: 'Coordinate assolute nel modello' },
        { name: 'Rotazione', value: 'Angoli sui tre assi' },
        { name: 'Allineamento', value: 'Rispetto a faccia o bordo' },
        { name: 'Scala', value: 'Dimensioni in mm' },
      ]},
      { type: 'callout', variant: 'blue', title: 'TIP — Allineamento automatico', content: 'Usa l\'allineamento automatico per ancorare l\'oggetto a una faccia specifica della confezione. L\'oggetto si sposterà automaticamente con le pieghe dell\'animazione.' },
    ],
  },
  'array-ripetizione': {
    subtitle: 'Duplicare oggetti per display e confezioni multiple',
    duration: '20 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Array di ripetizione', content: 'La funzione Array di ripetizione permette di duplicare un oggetto 3D secondo un pattern regolare. È particolarmente utile per simulare display con più prodotti o confezioni con ripetizioni geometriche.' },
      { type: 'steps', items: [
        'Selezionare l\'oggetto 3D da duplicare',
        'Accedere alla funzione Array dal menu contestuale',
        'Impostare numero di righe, colonne e livelli',
        'Definire la spaziatura tra gli elementi',
        'Confermare e verificare il risultato nella vista 3D',
      ]},
    ],
  },
  'quote-3d': {
    subtitle: 'Misurare le dimensioni reali comprensive dello spessore materiale',
    duration: '15 min',
    unitType: 'LESSON',
    contentBlocks: [
      { type: 'text', title: 'Quote tridimensionali', content: 'Le quote 3D permettono di verificare le dimensioni effettive del modello, includendo lo spessore del materiale. A differenza delle quote 2D, queste misurano la geometria reale della confezione montata.' },
      { type: 'callout', variant: 'blue', title: 'DIFFERENZA — Quote 2D vs 3D', content: 'Le quote 2D misurano il disegno piano. Le quote 3D misurano la struttura montata, considerando pieghe e spessore. La differenza può essere significativa su materiali spessi.' },
    ],
  },
  'esercitazione-finale': {
    subtitle: 'Workflow completo dal 2D al modello 3D esportabile',
    duration: '30 min',
    unitType: 'EXERCISE',
    contentBlocks: [
      { type: 'text', title: 'Esercitazione pratica', content: 'In questa esercitazione metterai in pratica tutto ciò che hai appreso, seguendo il workflow completo dalla struttura 2D alla simulazione 3D esportabile.' },
      { type: 'checklist', items: [
        'Aprire un disegno strutturale 2D esistente',
        'Generare il modello 3D dal disegno',
        'Eliminare la sequenza automatica',
        'Selezionare la superficie di base corretta',
        'Ricreare le fasi: Messa in volume, Chiusura fondo, Chiusura coperchio',
        'Applicare le azioni di piega a ciascuna fase',
        'Inserire un oggetto 3D prodotto nella confezione',
        'Configurare l\'allineamento dell\'oggetto',
        'Aggiungere quote 3D di verifica',
        'Esportare il modello in formato HTML',
        'Verificare l\'esportazione nel browser',
      ]},
    ],
  },
}

async function main() {
  console.log('🌱 Seeding database (completo)...')

  // ─── Admin user ────────────────────────────────
  const adminHash = await bcrypt.hash('admin2026!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@serviform.com' },
    update: {},
    create: {
      email: 'admin@serviform.com',
      name: 'Admin Serviform',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })
  console.log('  ✓ Utente admin creato (admin@serviform.com)')

  // ─── Software ──────────────────────────────────
  const engview = await prisma.software.upsert({
    where: { slug: 'engview' },
    update: { tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875' },
    create: { name: 'EngView', slug: 'engview', tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875' },
  })
  const sysform = await prisma.software.upsert({
    where: { slug: 'sysform' },
    update: { tagline: 'Gestione e ottimizzazione della produzione', color: '#2D6A4F' },
    create: { name: 'Sysform', slug: 'sysform', tagline: 'Gestione e ottimizzazione della produzione', color: '#2D6A4F' },
  })
  const projecto = await prisma.software.upsert({
    where: { slug: 'projecto' },
    update: { tagline: 'Project management e workflow creativo', color: '#067DB8' },
    create: { name: 'ProjectO', slug: 'projecto', tagline: 'Project management e workflow creativo', color: '#067DB8' },
  })
  console.log('  ✓ Software creati con metadata')

  // ─── Courses ───────────────────────────────────
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
  console.log('  ✓ Corsi creati con livello/durata/disponibilità')

  // ─── Units con content blocks ──────────────────
  const engview3d = await prisma.course.findUnique({ where: { slug: 'engview-3d' } })
  if (engview3d) {
    const unitSlugs = Object.keys(UNIT_CONTENT)
    for (let i = 0; i < unitSlugs.length; i++) {
      const slug = unitSlugs[i]
      const content = UNIT_CONTENT[slug]
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        .replace('3d', '3D').replace('Panoramica', 'Panoramica del Modulo')

      // Titoli corretti dal prototipo
      const TITLES: Record<string, string> = {
        'panoramica': 'Panoramica del Modulo',
        'struttura-ambiente-3d': "Struttura dell'ambiente 3D",
        'ricostruzione-sequenza': 'Ricostruzione manuale della sequenza',
        'azioni-piega': 'Applicazione delle azioni di piega',
        'superficie-base': 'Selezione della superficie di base',
        'inserisci-vista': 'Azione Inserisci Vista',
        'oggetto-3d': 'Inserimento di un oggetto 3D',
        'allineamento-3d': 'Proprietà oggetto 3D: Allineamento',
        'array-ripetizione': 'Array di ripetizione',
        'quote-3d': 'Quote 3D e verifica dimensionale',
        'esercitazione-finale': 'Esercitazione finale',
      }

      const existing = await prisma.unit.findFirst({
        where: { courseId: engview3d.id, slug },
      })

      const unitData = {
        title: TITLES[slug] || title,
        slug,
        order: i + 1,
        subtitle: content.subtitle,
        duration: content.duration,
        unitType: content.unitType as any,
        contentBlocks: content.contentBlocks,
        courseId: engview3d.id,
      }

      let unitId: string
      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: {
            subtitle: content.subtitle,
            duration: content.duration,
            unitType: content.unitType as any,
            contentBlocks: content.contentBlocks,
          },
        })
        unitId = existing.id
      } else {
        const created = await prisma.unit.create({ data: unitData })
        unitId = created.id
      }

      // Guide Zendesk (unità 2-10, indici 0-8)
      if (i >= 1 && i <= 9 && ZD_GUIDES[i - 1]) {
        const guide = ZD_GUIDES[i - 1]
        const existingGuide = await prisma.guideReference.findUnique({ where: { unitId } })
        if (!existingGuide) {
          await prisma.guideReference.create({ data: { ...guide, unitId } })
        }
      }
    }
    console.log('  ✓ Unità con content blocks e guide Zendesk')
  }

  // ─── Video Pillole ─────────────────────────────
  const pills = [
    { title: 'Introduzione al modulo 3D di EngView', youtubeId: 'zt4aT5oKLII', description: 'Trasforma un disegno 2D in modello 3D interattivo.', softwareId: engview.id },
    { title: 'Fasi, Passi e Azioni nella sequenza 3D', youtubeId: 'kqFPxe_E7WI', description: "Struttura gerarchica dell'animazione e organizzazione delle fasi di montaggio.", softwareId: engview.id },
    { title: 'Azioni di piega nel modulo 3D', youtubeId: '8qhtL4Rv0gI', description: 'Angoli assoluti e sequenze di piegatura realistiche.', softwareId: engview.id },
    { title: 'Inserire oggetti 3D nella scatola', youtubeId: 'pQlUjW3xhes', description: 'Inserimento e configurazione di oggetti prodotto nella simulazione.', softwareId: engview.id },
    { title: 'Array di ripetizione per prodotti multipli', youtubeId: '1ybZCklt4Bg', description: 'Duplica oggetti 3D per simulare display e confezioni con più pezzi.', softwareId: engview.id },
    { title: 'Quote 3D e verifica dimensionale', youtubeId: 'bd2mps58Flo', description: 'Misura le dimensioni reali comprensive dello spessore del materiale.', softwareId: engview.id },
    { title: 'Opzioni di rappresentazione visiva', youtubeId: 'N1K1haAkC_M', description: 'Sfondo, illuminazione e file HDR per una presentazione professionale.', softwareId: engview.id },
    { title: 'Esportazione HTML del modello 3D', youtubeId: 'BF8az5d9418', description: 'Condividi la simulazione senza necessità di EngView installato.', softwareId: engview.id },
    { title: 'Workflow completo: dal 2D al modello 3D', youtubeId: '-69Uk74NXtU', description: 'Esercitazione guidata end-to-end dalla struttura 2D alla simulazione esportabile.', softwareId: engview.id },
  ]
  for (const p of pills) {
    await prisma.videoPill.upsert({ where: { youtubeId: p.youtubeId }, update: {}, create: p })
  }
  console.log('  ✓ Video pillole')

  console.log('✅ Seed completo!')
}

main()
  .catch((e) => { console.error('❌ Errore:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
