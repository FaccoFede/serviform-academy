import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Serviform Academy v3...')

  // ─── Software (4 famiglie ufficiali) ──────────────────────────────────────
  const engview = await prisma.software.upsert({
    where: { slug: 'engview' },
    update: { tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875', lightColor: '#EEF3FA' },
    create: { name: 'EngView', slug: 'engview', tagline: 'Progettazione strutturale packaging 2D e 3D', color: '#003875', lightColor: '#EEF3FA' },
  })
  const sysform = await prisma.software.upsert({
    where: { slug: 'sysform' },
    update: { tagline: 'Gestione e ottimizzazione della produzione', color: '#E63329', lightColor: '#FFF1F0' },
    create: { name: 'Sysform', slug: 'sysform', tagline: 'Gestione e ottimizzazione della produzione', color: '#E63329', lightColor: '#FFF1F0' },
  })
  const projecto = await prisma.software.upsert({
    where: { slug: 'projecto' },
    update: { tagline: 'Project management e workflow creativo', color: '#067DB8', lightColor: '#E3F4FC' },
    create: { name: 'ProjectO', slug: 'projecto', tagline: 'Project management e workflow creativo', color: '#067DB8', lightColor: '#E3F4FC' },
  })
  // ServiformA — quarta famiglia ufficiale
  const serviformA = await prisma.software.upsert({
    where: { slug: 'serviformA' },
    update: { tagline: 'Gestione amministrativa e documentale Serviform', color: '#2D6A4F', lightColor: '#EDFAF3' },
    create: { name: 'ServiformA', slug: 'serviformA', tagline: 'Gestione amministrativa e documentale Serviform', color: '#2D6A4F', lightColor: '#EDFAF3' },
  })
  console.log('  ✓ Software: EngView, Sysform, ProjectO, ServiformA')

  // ─── Corsi (publishState al posto di available) ────────────────────────────
  const coursesData = [
    {
      title: 'Modulo 3D',
      slug: 'engview-3d',
      description: 'Trasforma i disegni strutturali 2D in modelli tridimensionali interattivi e simula il montaggio del packaging.',
      softwareId: engview.id,
      level: 'Intermedio',
      duration: '3h 30m',
      objective: 'Creare e animare un modello 3D esportabile da un disegno strutturale 2D.',
      publishState: 'PUBLISHED',
      available: true,
    },
    {
      title: 'Modulo 2D',
      slug: 'engview-2d',
      description: 'Crea e gestisci disegni strutturali per packaging con gli strumenti di progettazione 2D.',
      softwareId: engview.id,
      level: 'Base',
      duration: '2h 00m',
      objective: 'Disegnare e modificare strutture 2D per packaging in EngView.',
      publishState: 'VISIBLE_LOCKED',
      available: false,
    },
    {
      title: 'Nesting e Ottimizzazione',
      slug: 'engview-nesting',
      description: 'Massimizza il rendimento del foglio con gli strumenti di nesting automatico e semi-automatico.',
      softwareId: engview.id,
      level: 'Avanzato',
      duration: '1h 45m',
      objective: 'Ottimizzare la resa del foglio con nesting avanzato.',
      publishState: 'VISIBLE_LOCKED',
      available: false,
    },
    {
      title: 'Sysform Introduzione',
      slug: 'sysform-base',
      description: 'Panoramica completa del sistema Sysform per la gestione del processo produttivo.',
      softwareId: sysform.id,
      level: 'Base',
      duration: '2h 00m',
      objective: 'Navigare e configurare Sysform per il proprio processo produttivo.',
      publishState: 'VISIBLE_LOCKED',
      available: false,
    },
    {
      title: 'ProjectO Primi passi',
      slug: 'projecto-start',
      description: 'Configura il tuo spazio di lavoro e gestisci i primi progetti con ProjectO.',
      softwareId: projecto.id,
      level: 'Base',
      duration: '1h 30m',
      objective: 'Creare e gestire un progetto base in ProjectO.',
      publishState: 'VISIBLE_LOCKED',
      available: false,
    },
  ]

  for (const c of coursesData) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: { level: c.level, duration: c.duration, publishState: c.publishState as any, available: c.available },
      create: c as any,
    })
  }
  console.log('  ✓ Corsi (con publishState)')

  // ─── Azienda demo ─────────────────────────────────────────────────────────
  const demoCompany = await prisma.company.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company S.r.l.',
      slug: 'demo-company',
      contractType: 'Standard',
      assistanceExpiresAt: new Date('2027-12-31'),
      notes: 'Azienda demo per test della piattaforma',
    },
  })

  // Interesse EngView per la demo company
  await prisma.companyInterest.upsert({
    where: { companyId_softwareId: { companyId: demoCompany.id, softwareId: engview.id } },
    update: {},
    create: { companyId: demoCompany.id, softwareId: engview.id },
  })

  // Assegnazione corso demo
  const engview3dCourse = await prisma.course.findUnique({ where: { slug: 'engview-3d' } })
  if (engview3dCourse) {
    await prisma.companyCourseAssignment.upsert({
      where: { companyId_courseId: { companyId: demoCompany.id, courseId: engview3dCourse.id } },
      update: {},
      create: {
        companyId: demoCompany.id,
        courseId: engview3dCourse.id,
        accessType: 'ACTIVE',
        expiresAt: null, // illimitato
      },
    })
  }
  console.log('  ✓ Azienda demo con assegnazione corso')

  // ─── Annuncio di benvenuto ─────────────────────────────────────────────────
  const existing = await prisma.announcement.findFirst({ where: { title: 'Benvenuto in Serviform Academy' } })
  if (!existing) {
    await prisma.announcement.create({
      data: {
        title: 'Benvenuto in Serviform Academy',
        body: 'La piattaforma è online! Inizia dal Modulo 3D di EngView per scoprire tutte le funzionalità disponibili.',
        type: 'NEWS',
        published: true,
        publishedAt: new Date(),
      },
    })
  }
  console.log('  ✓ Annuncio di benvenuto')

  console.log('✅ Seed v3 completo!')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
