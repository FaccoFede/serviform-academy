'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand } from '@/lib/brands'
import ProtectedVideo from '@/components/features/ProtectedVideo'
import ExerciseCard from '@/components/features/ExerciseCard'
import styles from './UnitPage.module.css'
import { api } from '@/lib/api'

const PREVIEW_UNITS = 2

export default function UnitPage({ params }: { params: Promise<{ slug: string; unit: string }> }) {
  // Next.js 16 / React 19: params è una Promise — usa React.use() per sbloccarla
  const { slug, unit: unitSlug } = use(params)

  const { user } = useAuth()
  const { markCompleted, markViewed, isCompleted, loadCompletedUnitsFromServer } = useProgress()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug || !unitSlug) return
    api.units.findBySlug(slug, unitSlug)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, unitSlug])

  useEffect(() => {
    if (user && slug) loadCompletedUnitsFromServer(slug)
  }, [user, slug])

  useEffect(() => {
    if (user && data?.id) markViewed(data.id)
  }, [user, data?.id])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',color:'var(--muted)',fontSize:14}}>
      Caricamento...
    </div>
  )
  if (!data) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - var(--topbar-h))',color:'var(--muted)',fontSize:14}}>
      Unità non trovata.{' '}
      <Link href={`/courses/${slug}`} style={{color:'var(--red)',fontWeight:700,marginLeft:8}}>Torna al corso</Link>
    </div>
  )

  const units = (data.course?.units || []).filter((u: any) => u.unitType === 'LESSON')
  const currentIndex = units.findIndex((u: any) => u.slug === unitSlug)
  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null
  const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null
  const brand = getBrand(data.course?.software?.slug || '')
  const isCurrentDone = isCompleted(data.id)
  const isPreview = currentIndex < PREVIEW_UNITS
  const isLocked = !user && !isPreview

  const completedCount = units.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = units.length > 0 ? Math.round((completedCount / units.length) * 100) : 0

  async function handleComplete() {
    await markCompleted(data.id)
    if (nextUnit) window.location.href = `/courses/${slug}/${nextUnit.slug}`
    else window.location.href = `/courses/${slug}`
  }

  // Vista bloccata per non loggati dopo le prime PREVIEW_UNITS unità
  if (isLocked) {
    return (
      <main className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{data.course?.title}</span>
            </Link>
          </div>
          <nav className={styles.sidebarUnits}>
            {units.map((u: any, i: number) => (
              <div key={u.id} className={[styles.unitItem, i < PREVIEW_UNITS ? '' : styles.unit_locked_item].join(' ')}>
                <div className={styles.unitDot} data-state={i < PREVIEW_UNITS ? 'available' : 'locked'}>
                  {i < PREVIEW_UNITS
                    ? <span style={{fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700}}>{i+1}</span>
                    : <svg viewBox="0 0 12 12" fill="none" width={9} height={9}><rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  }
                </div>
                <span className={styles.unitName} style={{opacity: i < PREVIEW_UNITS ? 1 : 0.4}}>{u.title}</span>
              </div>
            ))}
          </nav>
        </aside>

        <section className={styles.content}>
          <div className={styles.topbar}>
            <div className={styles.breadcrumb}>
              <Link href={`/courses/${slug}`} className={styles.bcLink}>{data.course?.title}</Link>
              <span className={styles.bcSep}>/</span>
              <span className={styles.bcCurrent}>{data.title}</span>
            </div>
            <span className={styles.counter}>{currentIndex + 1} / {units.length}</span>
          </div>

          {/* Contenuto sfocato + overlay */}
          <div style={{position:'relative',flex:1,overflow:'hidden'}}>
            <div style={{padding:'48px 60px',maxWidth:800,filter:'blur(6px)',opacity:0.25,pointerEvents:'none',userSelect:'none'}}>
              {data.videoUrl && <div style={{width:'100%',aspectRatio:'16/9',background:'#000',borderRadius:10,marginBottom:24}}/>}
              {data.content && <div dangerouslySetInnerHTML={{__html: data.content}}/>}
            </div>

            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(to bottom, rgba(250,250,250,0.5) 0%, rgba(250,250,250,0.97) 35%)'}}>
              <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'48px 44px',maxWidth:460,width:'100%',textAlign:'center',boxShadow:'var(--shadow-lg)'}}>
                <div style={{fontSize:44,marginBottom:20}}>🔒</div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,marginBottom:12,letterSpacing:'-0.5px'}}>Contenuto riservato</h2>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.7,marginBottom:28}}>
                  Hai visualizzato le prime <strong>{PREVIEW_UNITS} unità</strong> gratuitamente.
                  Per continuare il corso accedi con un account abilitato.
                </p>
                <Link href="/auth/login" style={{display:'flex',alignItems:'center',justifyContent:'center',height:48,background:'var(--red)',color:'#fff',borderRadius:10,fontSize:15,fontWeight:700,textDecoration:'none',marginBottom:12,boxShadow:'0 2px 14px rgba(230,51,41,0.2)'}}>
                  Accedi per continuare
                </Link>
                <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" style={{fontSize:13,color:'var(--muted)',fontWeight:700,textDecoration:'none',display:'block'}}>
                  Non hai accesso? Contatta Serviform →
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerNav}>
            {prevUnit && currentIndex > 0 && currentIndex - 1 < PREVIEW_UNITS ? (
              <Link href={`/courses/${slug}/${prevUnit.slug}`} className={styles.navBtn}>← Precedente</Link>
            ) : <span/>}
            <span className={styles.navCenter}>{currentIndex + 1} di {units.length}</span>
            <Link href="/auth/login" className={styles.navComplete}>Accedi per continuare →</Link>
          </div>
        </section>
      </main>
    )
  }

  // Vista normale
  return (
    <main className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
            <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{data.course?.title}</span>
          </Link>
          <span className={styles.sidebarTag} style={{background:brand.light,color:brand.color}}>{brand.name}</span>
        </div>

        <div className={styles.sidebarProgress}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Progresso</span>
            <span className={styles.progressValue}>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}><div className={styles.progressFill} style={{width:`${progressPercent}%`}}/></div>
          <span className={styles.progressSub}>{completedCount} di {units.length} unità</span>
        </div>

        <nav className={styles.sidebarUnits}>
          {units.map((u: any, i: number) => {
            const done = isCompleted(u.id)
            const cur = u.slug === unitSlug
            const state = done ? 'done' : cur ? 'current' : 'available'
            return (
              <Link key={u.id} href={`/courses/${slug}/${u.slug}`} className={[styles.unitItem, styles[`unit_${state}`]].join(' ')}>
                <div className={styles.unitDot} data-state={state}>
                  {state === 'done' && <svg viewBox="0 0 12 12" fill="none" width={8} height={8}><path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {state === 'current' && <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                  {state === 'available' && <span style={{fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700}}>{i+1}</span>}
                </div>
                <div className={styles.unitText}>
                  <span className={styles.unitName}>{u.title}</span>
                  {u.duration && <span className={styles.unitDur}>{u.duration}</span>}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Link href={`/courses/${slug}`} className={styles.bcLink}>{data.course?.title}</Link>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{data.title}</span>
          </div>
          <div className={styles.topbarRight}>
            {isCurrentDone && <span className={styles.doneBadge}>✓ Completata</span>}
            {!user && isPreview && <span className={styles.previewBadge}>Anteprima gratuita</span>}
            <span className={styles.counter}>{currentIndex+1} / {units.length}</span>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.unitHeader}>
            <div className={styles.unitMeta}>
              <span className={styles.unitBadge}>Unità {data.order}</span>
              {data.duration && <span className={styles.unitBadge}>{data.duration}</span>}
            </div>
            <h1 className={styles.unitTitle}>{data.title}</h1>
            {data.subtitle && <p className={styles.unitSubtitle}>{data.subtitle}</p>}
          </div>
            <div className={styles.videoWrapper}>
              <ProtectedVideo url={data.videoUrl} title={data.title}/>
            </div>
          {data.content && <div className={styles.richContent} dangerouslySetInnerHTML={{__html: data.content}}/>}
          {!data.videoUrl && !data.content && <p style={{color:'var(--muted)',padding:'40px 0'}}>Nessun contenuto per questa unità.</p>}

          {data.exercises?.length > 0 && (
            <div className={styles.exercisesSection}>
              <h3 className={styles.exercisesTitle}>Esercitazioni pratiche</h3>
              {data.exercises.map((ex: any) => <ExerciseCard key={ex.id} title={ex.title} description={ex.description} htmlUrl={ex.htmlUrl} evdUrl={ex.evdUrl}/>)}
            </div>
          )}

          {(data.guides?.length > 0 || data.guide) && (
      <div className={styles.guideSection}>
       <span className={styles.guideLabel}>
        {(data.guides?.length || 1) > 1 ? 'Guide di riferimento' : 'Guida di riferimento'}
       </span>
       {/* Supporta sia il vecchio campo guide (singolo) che il nuovo guides (array) */}
       {(data.guides?.length > 0 ? data.guides : [data.guide]).map((g: any) => (
         <a
           key={g.id}
           href={g.url}
           target="_blank"
           rel="noopener noreferrer"
           className={styles.guideLink}
         >
           <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
             <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
             <path d="M9 2h5v5M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>
           {g.title}
         </a>
       ))}
     </div>
   )}
        </div>

        <div className={styles.footerNav}>
          {prevUnit ? (
            <Link href={`/courses/${slug}/${prevUnit.slug}`} className={styles.navBtn}>← Precedente</Link>
          ) : <span/>}
          <span className={styles.navCenter}>{currentIndex+1} di {units.length}</span>
          {user ? (
            !isCurrentDone ? (
              <button className={styles.navComplete} onClick={handleComplete}>
                {nextUnit ? '✓ Completa e continua' : '✓ Completa il modulo'}
              </button>
            ) : nextUnit ? (
              <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>Continua →</Link>
            ) : (
              <Link href={`/courses/${slug}`} className={styles.navFinish}>Torna al corso →</Link>
            )
          ) : nextUnit && currentIndex < PREVIEW_UNITS - 1 ? (
            <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>Continua anteprima →</Link>
          ) : (
            <Link href="/auth/login" className={styles.navComplete}>Accedi per continuare →</Link>
          )}
        </div>
      </section>
    </main>
  )
}
