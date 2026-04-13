import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * GuideCatalogService — catalogo centralizzato di guide Zendesk.
 *
 * Flusso:
 *  1. L'admin inserisce solo l'URL della guida.
 *  2. Il servizio scarica la pagina e ne estrae il <title>.
 *  3. La guida viene salvata nel catalogo ed è selezionabile dalle unità.
 *
 * Rimane possibile passare manualmente un titolo se il recupero fallisce
 * (es. guide dietro login o host non raggiungibile dal backend).
 */
@Injectable()
export class GuideCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.guideCatalog.findMany({ orderBy: { title: 'asc' } })
  }

  async create(data: { url: string; title?: string; zendeskId?: string }) {
    if (!data.url?.trim()) throw new BadRequestException('URL obbligatorio')
    const url = data.url.trim()

    const existing = await this.prisma.guideCatalog.findUnique({ where: { url } })
    if (existing) return existing

    // Prova a recuperare il titolo dalla pagina se non fornito
    let title = data.title?.trim() || ''
    if (!title) {
      title = (await this.fetchTitle(url)) || url
    }

    // Se l'URL contiene un ID Zendesk numerico, lo estraiamo
    const zendeskMatch = url.match(/\/articles\/(\d+)/) || url.match(/\/hc\/.*\/(\d{6,})/)
    const zendeskId = data.zendeskId?.trim() || zendeskMatch?.[1] || null

    return this.prisma.guideCatalog.create({
      data: { url, title, zendeskId },
    })
  }

  async update(id: string, data: { title?: string; url?: string; zendeskId?: string }) {
    const g = await this.prisma.guideCatalog.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('Guida non trovata nel catalogo')
    return this.prisma.guideCatalog.update({ where: { id }, data })
  }

  /** Forza il re-fetch del titolo dalla pagina remota */
  async refreshTitle(id: string) {
    const g = await this.prisma.guideCatalog.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('Guida non trovata nel catalogo')
    const title = await this.fetchTitle(g.url)
    if (!title) throw new BadRequestException('Impossibile recuperare il titolo dalla pagina remota')
    return this.prisma.guideCatalog.update({ where: { id }, data: { title } })
  }

  async remove(id: string) {
    const g = await this.prisma.guideCatalog.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('Guida non trovata nel catalogo')
    return this.prisma.guideCatalog.delete({ where: { id } })
  }

  // ── Utility ────────────────────────────────────────────────────────────

  /**
   * Scarica l'HTML della pagina e restituisce il contenuto del tag <title>.
   * Ritorna null in caso di errore (host irraggiungibile, no title, ecc.)
   * così il chiamante può decidere un fallback.
   */
  private async fetchTitle(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Serviform-Academy/1.0 (GuideCatalog)' },
        // timeout "soft" — in Node >=18 non c'è un'opzione nativa, fetch si basa sull'abort
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
      } as any)
      if (!res.ok) return null
      const html = await res.text()
      // Cerca <title>...</title>
      const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      if (!m) return null
      // Rimuove suffissi tipo " – Zendesk", " | Help Center" e whitespace
      return m[1]
        .replace(/\s+/g, ' ')
        .replace(/(\s[–|-]\s.*)$/, '')
        .trim()
    } catch {
      return null
    }
  }
}
