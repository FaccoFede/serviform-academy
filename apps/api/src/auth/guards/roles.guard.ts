import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * RolesGuard — verifica che l'utente autenticato abbia uno dei ruoli richiesti.
 *
 * Va usato SEMPRE dopo JwtAuthGuard (che popola req.user).
 * Se nessun ruolo è richiesto (@Roles non applicato), lascia passare.
 *
 * NOTA: Roles e ROLES_KEY sono definiti in auth/decorators/roles.decorator.ts
 * Importare da lì, non da questo file.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Nessun ruolo richiesto → accesso libero (solo autenticazione JWT necessaria)
    if (!requiredRoles || requiredRoles.length === 0) return true

    const { user } = context.switchToHttp().getRequest()

    // Se il JWT guard non ha popolato user → fallisce
    if (!user?.role) return false

    return requiredRoles.includes(user.role)
  }
}
