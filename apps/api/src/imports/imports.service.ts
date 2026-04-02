import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

export interface ImportResult {
  imported: number
  failed: number
  errors: { row: number; reason: string }[]
  dryRun: boolean
}

function parseCsv(raw: string): string[][] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line =>
      line.split(',').map(cell =>
        cell.trim().replace(/^["']|["']$/g, ''),
      ),
    )
}

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  async importCompanies(csv: string, importedBy: string): Promise<ImportResult> {
    const rows = parseCsv(csv)
    if (rows.length < 2) throw new BadRequestException('Il CSV deve avere intestazione e almeno una riga')

    const header = rows[0].map(h => h.toLowerCase())
    const nameIdx = header.indexOf('name')
    const contractIdx = header.indexOf('contracttype')
    const expiresIdx = header.indexOf('assistanceexpiresat')
    const notesIdx = header.indexOf('notes')

    if (nameIdx === -1) throw new BadRequestException('Colonna "name" obbligatoria mancante')

    const result: ImportResult = { imported: 0, failed: 0, errors: [], dryRun: false }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const name = row[nameIdx]?.trim()

      if (!name) {
        result.failed++
        result.errors.push({ row: i + 1, reason: 'name mancante' })
        continue
      }

      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
        '-' + Date.now() + '-' + i

      const expiresRaw = expiresIdx >= 0 ? row[expiresIdx]?.trim() : null
      let assistanceExpiresAt: Date | null = null
      if (expiresRaw && expiresRaw !== '' && expiresRaw !== '∞') {
        const d = new Date(expiresRaw)
        if (!isNaN(d.getTime())) assistanceExpiresAt = d
      }

      try {
        await this.prisma.company.upsert({
          where: { slug },
          update: {
            name,
            contractType: contractIdx >= 0 ? row[contractIdx]?.trim() || null : null,
            assistanceExpiresAt,
            notes: notesIdx >= 0 ? row[notesIdx]?.trim() || null : null,
          },
          create: {
            name,
            slug,
            contractType: contractIdx >= 0 ? row[contractIdx]?.trim() || null : null,
            assistanceExpiresAt,
            notes: notesIdx >= 0 ? row[notesIdx]?.trim() || null : null,
          },
        })
        result.imported++
      } catch (e: any) {
        result.failed++
        result.errors.push({ row: i + 1, reason: e.message || 'Errore database' })
      }
    }

    return result
  }

  async importUsers(csv: string, importedBy: string): Promise<ImportResult> {
    const rows = parseCsv(csv)
    if (rows.length < 2) throw new BadRequestException('Il CSV deve avere intestazione e almeno una riga')

    const header = rows[0].map(h => h.toLowerCase())
    const emailIdx = header.indexOf('email')
    const nameIdx = header.indexOf('name')
    const firstNameIdx = header.indexOf('firstname')
    const lastNameIdx = header.indexOf('lastname')
    const roleIdx = header.indexOf('role')
    const companyIdx = header.indexOf('companyname')
    const passwordIdx = header.indexOf('password')

    if (emailIdx === -1) throw new BadRequestException('Colonna "email" obbligatoria mancante')

    const result: ImportResult = { imported: 0, failed: 0, errors: [], dryRun: false }
    const VALID_ROLES = ['USER', 'ADMIN', 'TEAM_ADMIN']
    const DEFAULT_PASSWORD = 'ChangeMe123!'

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[emailIdx]?.trim().toLowerCase()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.failed++
        result.errors.push({ row: i + 1, reason: `email non valida: "${email}"` })
        continue
      }

      const role =
        roleIdx >= 0 && VALID_ROLES.includes(row[roleIdx]?.trim().toUpperCase())
          ? row[roleIdx].trim().toUpperCase()
          : 'USER'

      const rawPassword = passwordIdx >= 0 ? row[passwordIdx]?.trim() : null
      const passwordHash = await bcrypt.hash(rawPassword || DEFAULT_PASSWORD, 10)

      let companyId: string | undefined
      if (companyIdx >= 0 && row[companyIdx]?.trim()) {
        const companyName = row[companyIdx].trim()
        const company = await this.prisma.company.findFirst({
          where: { name: { contains: companyName, mode: 'insensitive' }, deletedAt: null },
        })
        if (company) companyId = company.id
      }

      try {
        const existing = await this.prisma.user.findUnique({ where: { email } })

        if (existing) {
          await this.prisma.user.update({
            where: { email },
            data: {
              name: nameIdx >= 0 ? row[nameIdx]?.trim() || existing.name : existing.name,
              firstName: firstNameIdx >= 0 ? row[firstNameIdx]?.trim() || existing.firstName : existing.firstName,
              lastName: lastNameIdx >= 0 ? row[lastNameIdx]?.trim() || existing.lastName : existing.lastName,
              role: role as any,
              mustChangePassword: !rawPassword,
            },
          })
          if (companyId) {
            await this.prisma.companyMembership.upsert({
              where: { userId: existing.id },
              update: { companyId },
              create: { userId: existing.id, companyId },
            })
          }
        } else {
          const user = await this.prisma.user.create({
            data: {
              email,
              name: nameIdx >= 0 ? row[nameIdx]?.trim() || null : null,
              firstName: firstNameIdx >= 0 ? row[firstNameIdx]?.trim() || null : null,
              lastName: lastNameIdx >= 0 ? row[lastNameIdx]?.trim() || null : null,
              passwordHash,
              role: role as any,
              mustChangePassword: !rawPassword,
            },
          })
          if (companyId) {
            await this.prisma.companyMembership.create({
              data: { userId: user.id, companyId },
            })
          }
        }
        result.imported++
      } catch (e: any) {
        result.failed++
        result.errors.push({ row: i + 1, reason: e.message || 'Errore database' })
      }
    }

    return result
  }
}
