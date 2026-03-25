import { SetMetadata } from '@nestjs/common'

/**
 * Chiave usata da RolesGuard per leggere i ruoli richiesti.
 * Fonte unica — importare SEMPRE da qui, mai da roles.guard.ts.
 */
export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
