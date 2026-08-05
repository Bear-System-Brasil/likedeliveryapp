/**
 * =============================================================================
 * SERVICES - EXPORTAÇÕES CENTRALIZADAS
 * =============================================================================
 * 
 * Arquivo barrel para facilitar imports dos services.
 * 
 * Ao invés de:
 * ```typescript
 * import { apiService } from '@/services/api'
 * import { otherService } from '@/services/other'
 * ```
 * 
 * Use:
 * ```typescript
 * import { apiService, otherService } from '@/services'
 * ```
 */

export { apiService } from './api'
export type {
  ApiResponse, Category,
  Company, CreateCategoryRequest,
  CreateCompanyRequest, CreateProductRequest, CreateUserRequest, Order, Product, User
} from './api'

