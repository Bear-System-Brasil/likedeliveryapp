/**
 * =============================================================================
 * API SERVICE - CENTRAL DE INTEGRAÇÃO COM BACKEND
 * =============================================================================
 *
 * Este é o ÚNICO arquivo que faz requisições HTTP para o backend.
 * Todos os endpoints estão centralizados aqui para facilitar manutenção.
 *
 * PADRÃO: Todas as respostas seguem o formato ApiResponse<T>:
 * {
 *   success: boolean,  // true se deu certo, false se erro
 *   data?: T,          // dados retornados (se success = true)
 *   message?: string   // mensagem de erro (se success = false)
 * }
 *
 * IMPORTANTE: SEMPRE acesse response.data, nunca use response diretamente!
 *
 * Exemplo de uso correto:
 * ```typescript
 * const response = await apiService.getAllProducts()
 * if (response.success && response.data) {
 *   setProducts(response.data) // ✅ Correto
 * }
 * ```
 *
 * @see README.md para documentação completa
 */

import { Coords, ProductCategory, Restaurant } from "@/types/restaurant";
import { STORAGE_KEYS, storageManager } from "@/utils/storage-manager";

/**
 * Client fala com o BFF do próprio Next. Cookie httpOnly vai junto
 * automaticamente (same-origin). Nada de token no browser.
 */
const API_BASE_URL = "/api/proxy";

/**
 * Helper para obter usuário autenticado
 * Tenta primeiro do Zustand store, depois fallback para formato legado
 */
const getAuthUser = (): any | null => {
  if (typeof window === "undefined") return null;

  try {
    // Tentar pegar do Zustand store
    const authData = storageManager.local.get<any>(STORAGE_KEYS.AUTH);
    if (authData?.state?.user) {
      return authData.state.user;
    }

    // Fallback para formato legado
    const legacyUser = storageManager.local.get<any>(STORAGE_KEYS.LEGACY_USER);
    return legacyUser;
  } catch {
    return null;
  }
};

/**
 * Helper para encode de orderId na URL
 * Não faz encode de chaves Redis (que começam com 'cart:')
 * pois o backend precisa reconhecer o prefixo
 */
const encodeOrderId = (orderId: string): string => {
  // Se é uma chave Redis, não fazer encode
  if (orderId.startsWith("cart:")) {
    return orderId;
  }
  // Para UUIDs normais, fazer encode
  return encodeURIComponent(orderId);
};

export interface CreateUserRequest {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  birthDate: string;
  role?: string; // Optional - backend will assign 'client' by default if not provided
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password?: string; // Optional - only send if changing password
  birthDate: string;
  role: string;
  status: string;
  photoUrl?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  /** Status HTTP da resposta, quando houve resposta do servidor. */
  status?: number;
}

/**
 * Envelope das listas paginadas (ver pagination.md). `apiRequest` não
 * desembrulha isso - o corpo bruto `{data, meta}` cai inteiro em
 * `ApiResponse.data`, então quem consome precisa ler `.data.data`/`.data.meta`.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** `getCompanyOrders` / `getCompanyOrdersByStatus` — filtro de intervalo (ISO 8601, inclusivo). */
export interface OrderDateRangeParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
}

/** Máximo aceito pelo backend (ver pagination.md) - usar quando a tela
 * precisa do conjunto quase-completo numa única chamada (ex: Kanban ao vivo)
 * em vez de paginação de verdade. */
export const MAX_PAGE_LIMIT = 100;

function withPagination(endpoint: string, params?: PaginationParams): string {
  if (!params?.page && !params?.limit) return endpoint;
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}${qs.toString()}`;
}

function withOrderDateRange(endpoint: string, params?: OrderDateRangeParams): string {
  if (!params) return endpoint;
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  const query = qs.toString();
  if (!query) return endpoint;
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}${query}`;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  role: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recorte do cliente que o backend devolve embutido nas relações de
 * Order e Payment (ver order.md / payment.md). Existe para as telas
 * exibirem o nome - o `customerId` continua sendo a chave usada nas
 * chamadas de API, nunca o rótulo mostrado ao usuário.
 */
export interface CustomerRef {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string;
}

export interface LoginResponse {
  token: string;
  user: User | Company;
  type: "customer" | "company";
}

export interface LoginApiResponse {
  data: LoginResponse;
}

/**
 * Contrato real devolvido por /api/auth/login e /api/auth/register (BFF).
 * Sem token - a sessão vive no cookie httpOnly, o client só recebe o user.
 */
export interface AuthBffResponse {
  data: {
    user: (User | Company) & { companyId?: string | null };
  };
}

export interface ReportsParams {
  month?: string;
  startDate?: string;
  endDate?: string;
}
// ======================
// Reports types
// ======================
export interface ReportsOrdersByStatus {
  status: string;
  totalOrders: number;
}

export interface ReportsRevenueByDay {
  date: string;
  totalRevenue: number;
}

export interface ReportsTopProduct {
  productId: string;
  name: string;
  totalQuantity: number;
}

export interface ReportsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalDeliveries: number;
  averageDeliveryTime?: number;
  ordersByStatus?: ReportsOrdersByStatus[];
  revenueByDay?: ReportsRevenueByDay[];
  topProducts?: ReportsTopProduct[];
  revenueByOrderStatus?: ReportsOrdersByStatus[];
  totalExpenses?: {
    ingredientsCost: number;
    productsCost: number;
    shippingCost: number;
    discounts: number;
    totalExpenses: number;
  };
}

export interface ReportsParams {
  month?: string;
  startDate?: string;
  endDate?: string;
}

async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  data?: unknown,
  requiresAuth: boolean = false,
  // Alguns GETs exigem token só pra devolver dado (ex: complementos/tamanhos
  // de um prato, visíveis a qualquer visitante navegando o cardápio) - um
  // 401 aí não é "sessão expirada", é só "visitante sem login ainda". Não
  // dispara o popup global de login nem o toast de sessão nesses casos.
  silentUnauthorized: boolean = false,
): Promise<ApiResponse<T>> {
  try {
    const config: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    // Add body for POST, PUT, PATCH requests
    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    // Autenticação vai via cookie httpOnly, injetado pelo proxy do Next
    // (ver /api/proxy/[...path]) - mas só quando explicitamente pedido.
    // Sem esse sinal, o proxy manda tudo autenticado pra quem tá logado,
    // o que quebra endpoints publicos que o backend responde diferente
    // com token (ex: GET /company tenta usar o endereço do usuário).
    if (requiresAuth) {
      config.headers = { ...config.headers, "X-Auth-Required": "1" };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401 && requiresAuth) {
      if (!silentUnauthorized && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return {
        success: false,
        message: silentUnauthorized
          ? "Faça login para ver esta opção."
          : "Sessão expirada. Faça login novamente.",
        status: response.status,
      };
    }

    let result;

    // Verificar se a resposta tem conteúdo antes de parsear JSON
    // DELETE requests geralmente retornam 204 No Content
    const contentType = response.headers.get("content-type");
    const hasJsonContent =
      contentType && contentType.includes("application/json");

    if (response.status === 204 || !hasJsonContent) {
      // Resposta sem conteúdo (204 No Content) ou não-JSON
      result = null;
    } else {
      try {
        result = await response.json();
      } catch (parseError) {
        return {
          success: false,
          message: `Erro ao processar resposta do servidor (Status ${response.status})`,
        };
      }
    }

    if (!response.ok) {
      // Se não tem resultado (204 ou sem conteúdo), usar mensagem padrão
      if (!result) {
        if (process.env.NODE_ENV !== "production") {
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            method,
          });
        }

        return {
          success: false,
          message: `Erro ${response.status}: ${response.statusText}`,
        };
      }

      // Extract error message in a simple way
      let errorMessage: string;

      if (Array.isArray(result.message) && result.message.length > 0) {
        // Se for array, pega o primeiro elemento
        const firstMsg = result.message[0];
        errorMessage =
          typeof firstMsg === "string" ? firstMsg : JSON.stringify(firstMsg);
      } else if (typeof result.message === "string" && result.message.trim()) {
        errorMessage = result.message;
      } else if (Array.isArray(result.error) && result.error.length > 0) {
        const firstErr = result.error[0];
        errorMessage =
          typeof firstErr === "string" ? firstErr : JSON.stringify(firstErr);
      } else if (typeof result.error === "string" && result.error.trim()) {
        errorMessage = result.error;
      } else if (result.message && typeof result.message === "object") {
        // Se message é um objeto, tenta extrair informações úteis
        try {
          errorMessage = JSON.stringify(result.message);
        } catch (e) {
          errorMessage = "Erro ao processar resposta do servidor";
        }
      } else {
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }

      // Skip 404 logging on viewOrder - expected when no cart exists
      const is404OnViewOrder =
        response.status === 404 &&
        endpoint.includes("/order/") &&
        method === "GET";

      // Skip 404 logging on addProductToCart - expected when the orderId
      // persisted in localStorage points to a cart that already expired/
      // foi finalizado no backend. handleAddToCart já trata esse caso:
      // recria o carrinho e reenvia o item automaticamente.
      const is404OnAddToCart =
        response.status === 404 &&
        endpoint.includes("/order-item/cart") &&
        method === "POST";

      if (
        !is404OnViewOrder &&
        !is404OnAddToCart &&
        process.env.NODE_ENV !== "production"
      ) {
        // `serverMessage` e o corpo bruto do erro: sem eles o log so diz "400"
        // e a validacao que falhou fica invisivel.
        console.error("API Error:", {
          status: response.status,
          endpoint,
          method,
          serverMessage: errorMessage,
          body: result,
        });
      }

      return { success: false, message: errorMessage, status: response.status };
    }

    return { success: true, data: result, status: response.status };
  } catch (error) {
    return {
      success: false,
      message: "Erro de conexão. Verifique sua internet.",
    };
  }
}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
  created_at: string;
  updated_at: string;
}

export interface OrderedItem {
  id: string;
  created_at: string;
  deleted_at: string | null;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;
  isAvailable: boolean;
  companyId: string;
  stockQuantity?: number;
  imageURL?: ProductImage[];
  orderedItems: OrderedItem[];
  productCategories?: ProductCategory[];
  created_at: string;
  updated_at: string;
}

// Product types
export interface CreateProductRequest {
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;
  isAvailable: boolean;
  stockQuantity: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  isAvailable?: boolean;
  stockQuantity?: number;
}

// Product add-on types ("Complementos" - ex: Queijo Extra +R$3,50)
export interface ProductAddOn {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
  productId: string;
  created_at: string;
  updated_at: string;
}

export interface SaveProductAddOnRequest {
  name: string;
  priceModifier: number;
  isAvailable?: boolean;
}

// Product variation types ("Tamanhos" - ex: Grande +R$10,00)
export interface ProductVariation {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
  stockQuantity?: number;
  productId: string;
  created_at: string;
  updated_at: string;
}

export interface SaveProductVariationRequest {
  name: string;
  priceModifier: number;
  // Sempre obrigatório e sempre controlado pro backend (diferente de
  // AddOns, onde é opcional e null = ilimitado) - ver
  // variations-and-addons.md.
  stockQuantity: number;
  isAvailable?: boolean;
}

// Category types
export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  companyId: string;
  created_at: string;
  updated_at: string;
}

// Speciality types (restaurant types)
export interface Speciality {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Company types
export interface CreateCompanyRequest {
  tradeName: string;
  legalName: string;
  description: string;
  cnpj: string;
  email: string;
  phone: string;
  ownerId?: string;
  mainCategoryId?: string;
}

export interface Company {
  id: string;
  tradeName: string;
  legalName: string;
  description?: string;
  cnpj: string;
  email: string;
  phone: string;
  ownerId?: string;
  photoUrl?: string;
  logo_url?: string;
  cover_url?: string;
  status: string;
  categories?: Category[];
  speciality?: Speciality[];
  created_at: string;
  updated_at: string;
}

// Address types
export interface Address {
  id: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  latitude: number;
  longitude: number;
  customerId?: string; // Campo correto do Prisma (customers)
  userId?: string; // Mantido para compatibilidade
  companyId?: string;
  isDefault: boolean;
  // Soft delete - DELETE /address/me/:id só marca isActive: false, não
  // apaga o registro. Ausente = tratar como ativo (respostas antigas/mock).
  isActive?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressRequest {
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  // Breaking change do backend: agora exige number (@IsLatitude/@IsLongitude
  // rejeitam string). Nunca enviar como string.
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface UpdateAddressRequest {
  zipCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

// Order types
export interface Order {
  id: string;
  customerId: string;
  /** Relação incluída por GET /order/company (ver order.md). */
  customer?: CustomerRef;
  discount: number;
  totalShipping: number;
  totalValue: number;
  status:
    | "CART"
    | "ORDERED"
    | "AWAITING_PAYMENT"
    | "IN_PRODUCTION"
    | "READY_FOR_PICKUP"
    | "COMPLETED"
    | "CANCELED"
    | "ABANDONED";
  orderedItems?: OrderItem[];
  created_at: string;
  updated_at: string;
  /** Quando entrou no `status` atual — referência do cronômetro de coluna, não `updated_at`. */
  statusChangedAt: string;
  /** Fonte da verdade para entrega vs. retirada — não deduzir pela relação `delivery`. */
  fulfillmentType: "DELIVERY" | "PICKUP";
  cancelReason?: string | null;
  companyId: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  companyId: string; // OBRIGATÓRIO - ID do restaurante
  discount: number;
  totalShipping: number;
  totalValue: number;
  status:
    | "CART"
    | "ORDERED"
    | "AWAITING_PAYMENT"
    | "IN_PRODUCTION"
    | "READY_FOR_PICKUP"
    | "COMPLETED";
  observations?: string;
  payment?: string;
  orderedItems?: {
    productId: string;
    quantity: number;
    unitPrice: number;
    addIngredient?: {
      ingredientId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }[];
}

// Ingredient types
export interface Ingredient {
  id: string;
  description: string;
  category: string;
  supplier: string;
  batch: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  expirationDate: string;
  allergic?: string;
  isAvailable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIngredientRequest {
  description: string;
  category: string;
  supplier: string;
  batch: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  expirationDate: string;
  allergic?: string;
  isAvailable: boolean;
}

export interface UpdateIngredientRequest {
  description?: string;
  category?: string;
  supplier?: string;
  batch?: string;
  costPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
  expirationDate?: string;
  allergic?: string;
  isAvailable?: boolean;
}

// Payment types
export enum PaymentMethod {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PIX = "PIX",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface Payment {
  id: string;
  amount: number;
  orderId: string;
  customerId: string;
  /** Relação incluída pelas listas de /payment (ver payment.md). */
  customer?: CustomerRef;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transaction?: string;
  date?: Date;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  orderId: string;
  // customerId: string;
  paymentMethod: PaymentMethod;
  // status: PaymentStatus;
}

export interface UpdatePaymentRequest {
  amount?: number;
  orderId?: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
}
// ======================
// Cash Movement types
// ======================
export interface CashWithdrawalRequest {
  amount: number;
  description?: string;
}

export interface CashDepositRequest {
  amount: number;
  description?: string;
}

export interface CashSaleRequest {
  amount: number;
  paymentMethod: string;
  description?: string;
}

export interface CashRefundRequest {
  amount: number;
  description?: string;
  orderId?: string;
}

// ======================
// Cash Register types
// ======================
export interface OpenCashRegisterRequest {
  openingBalance: number;
  observations?: string;
}

export interface CloseCashRegisterRequest {
  countedTotal: number;
  observations?: string;
}

export interface CashRegister {
  id: string;
  openingBalance: number;
  openedAt: string;
  closedAt?: string;
  countedTotal?: number;
  observations?: string;
  status?: string;
}

export interface CashMovementSummary {
  availableBalance: number;
  totalSales: number;
  totalWithdrawals: number;
  totalDeposits: number;
  totalRefunds?: number;
  totalCash: number;
  totalCredit: number;
  totalDebit: number;
  totalPix: number;
  totalTransfer: number;
}
// Delivery types
export interface Delivery {
  id: string;
  orderId: string;
  driverId?: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "PICKED_UP"
    | "DELIVERED"
    | "RECEIVED"
    | "COMPLETED"
    | "CANCELED";
  pickupTime?: string;
  deliveryTime?: string;
  cancellationReason?: string;
  deliveryAddress: Address;
  estimatedTime: string;
  created_at: string;
  updated_at: string;
  order: Order;
}

export interface CreateDeliveryRequest {
  orderId: string; // UUID obrigatório
  deliveryAddressId: string; // UUID obrigatório - ID do endereço salvo
  deliveryPersonId?: string; // UUID opcional - ID do entregador
  observations?: string; // Observações sobre a entrega
  estimatedTime?: string; // Tempo estimado de entrega
}

export const apiService = {
  // User endpoints
  createUser: (userData: CreateUserRequest) =>
    apiRequest<User>("POST", "/user", userData),

  updateUser: (userData: UpdateUserRequest) =>
    apiRequest<User>("PUT", `/user`, userData, true),

  verifyOtp: (otpData: VerifyOtpRequest) =>
    apiRequest<string>("POST", "/user/complet", otpData),

  // Clientes vinculados à empresa autenticada (ver pagination.md)
  getCompanyCustomers: (params?: PaginationParams) =>
    apiRequest<PaginatedResponse<User>>(
      "GET",
      withPagination("/user/company/customers", params),
      undefined,
      true,
    ),

  // /user/me devolve o hash bcrypt da senha no corpo - nunca deixar isso
  // chegar no Zustand (persiste em localStorage via updateUser).
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiRequest<User & { password?: string }>(
      "GET",
      "/user/me",
      undefined,
      true,
    );
    if (response.success && response.data) {
      const { password: _password, ...safeUser } = response.data;
      return { ...response, data: safeUser };
    }
    return response as ApiResponse<User>;
  },

  // Auth endpoints - falam com as rotas BFF do Next (Set-Cookie httpOnly),
  // não com o proxy do NestJS.
  register: async (
    userData: CreateUserRequest,
  ): Promise<ApiResponse<AuthBffResponse>> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const result = await res.json().catch(() => null);
    return res.ok
      ? { success: true, data: result.data as AuthBffResponse }
      : { success: false, message: result?.message, status: res.status };
  },

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthBffResponse>> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await res.json().catch(() => null);
    return res.ok
      ? { success: true, data: result.data as AuthBffResponse }
      : { success: false, message: result?.message, status: res.status };
  },

  logout: async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" });
  },

  getSession: async (): Promise<{ authenticated: boolean; user: any }> => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    return res.json();
  },

  getInitialPhone: () =>
    apiRequest<{ phone: string }>("GET", "/auth/login/initial"),

  completeLogin: (data: { phone: string; code: string }) =>
    apiRequest<LoginResponse>("POST", "/auth/login/complet", data),

  // Password recovery endpoints - o backend identifica o usuário por
  // telefone (não email) nesses dois endpoints.
  forgotPassword: (data: { phone: string }) =>
    apiRequest<{ message: string }>("POST", "/auth/forgot-password", data),

  // reset-password devolve um token novo (login automático) - por isso,
  // diferente de forgotPassword, passa pelo BFF de auth (como login/register)
  // pra virar cookie de sessão httpOnly, em vez do proxy genérico.
  resetPassword: async (data: {
    phone: string;
    code: string;
    newPassword: string;
  }): Promise<ApiResponse<AuthBffResponse>> => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => null);
    return res.ok
      ? { success: true, data: result.data as AuthBffResponse }
      : { success: false, message: result?.message, status: res.status };
  },

  // Product endpoints
  getAllProducts: () => apiRequest<Product[]>("GET", "/product"),

  getProduct: (id: string) => apiRequest<Product>("GET", `/product/${id}`),

  getProductsByCompany: (companyId: string, params?: PaginationParams) =>
    apiRequest<PaginatedResponse<Product>>(
      "GET",
      withPagination(`/product/company/${companyId}`, params),
    ),

  createProduct: (productData: CreateProductRequest) =>
    apiRequest<Product>("POST", "/product", productData, true),

  updateProduct: (id: string, productData: UpdateProductRequest) =>
    apiRequest<Product>("PATCH", `/product/${id}`, productData, true),

  deleteProduct: (id: string) =>
    apiRequest<Product>("DELETE", `/product/${id}`, undefined, true),

  // Product image endpoints
  uploadProductImage: async (
    productId: string,
    file: File,
  ): Promise<ApiResponse<Product>> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE_URL}/product/image/${productId}`,
        {
          method: "POST",
          headers: { "X-Auth-Required": "1" },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Erro ao fazer upload da imagem",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao fazer upload da imagem do produto",
      };
    }
  },

  deleteProductImage: (productId: string, imageId: string) =>
    apiRequest<Product>(
      "DELETE",
      `/product/image/${productId}/${imageId}`,
      undefined,
      true,
    ),

  // Product add-on endpoints ("Complementos")
  productAddOns: {
    // O backend filtra por empresa (via JWT ou ?companyId=), não por
    // produto - o filtro por productId é feito no hook
    // (use-product-add-ons.ts). Staff sempre tem companyId no token; para
    // client (JWT sem companyId) o backend exige o query param, por isso
    // aceita companyId aqui mesmo no getAll "normal".
    getAll: (companyId?: string) =>
      apiRequest<ProductAddOn[]>(
        "GET",
        companyId
          ? `/product-add-ons?companyId=${companyId}`
          : "/product-add-ons",
        undefined,
        true,
      ),

    // Usado pelo modal de personalização do prato, acessível a visitante
    // não-logado navegando o cardápio - um 401/403 aí não deve abrir o
    // popup global de login (isso hoje sempre falha pra role client - o
    // backend só libera leitura pra admin/owner/manager/cook).
    getAllPublic: (companyId?: string) =>
      apiRequest<ProductAddOn[]>(
        "GET",
        companyId
          ? `/product-add-ons?companyId=${companyId}`
          : "/product-add-ons",
        undefined,
        true,
        true,
      ),

    create: (productId: string, data: SaveProductAddOnRequest) =>
      apiRequest<ProductAddOn>(
        "POST",
        `/product-add-ons/${productId}`,
        data,
        true,
      ),

    // O PATCH exige name + priceModifier juntos, mesmo pra só alternar
    // isAvailable - não é um partial update de verdade.
    update: (id: string, data: SaveProductAddOnRequest) =>
      apiRequest<ProductAddOn>("PATCH", `/product-add-ons/${id}`, data, true),

    delete: (id: string) =>
      apiRequest<ProductAddOn>(
        "DELETE",
        `/product-add-ons/${id}`,
        undefined,
        true,
      ),
  },

  // Product variation endpoints ("Tamanhos")
  productVariations: {
    // Ver comentário em productAddOns.getAll - mesmo esquema de
    // companyId via JWT (staff) ou query (client, cujo JWT não tem
    // companyId).
    getAll: (companyId?: string) =>
      apiRequest<ProductVariation[]>(
        "GET",
        companyId
          ? `/product-variation?companyId=${companyId}`
          : "/product-variation",
        undefined,
        true,
      ),

    // Diferente de productAddOns, o backend já libera leitura pra role
    // client aqui - só precisa do companyId via query já que o JWT do
    // client não carrega companyId.
    getAllPublic: (companyId?: string) =>
      apiRequest<ProductVariation[]>(
        "GET",
        companyId
          ? `/product-variation?companyId=${companyId}`
          : "/product-variation",
        undefined,
        true,
        true,
      ),

    create: (productId: string, data: SaveProductVariationRequest) =>
      apiRequest<ProductVariation>(
        "POST",
        `/product-variation/${productId}`,
        data,
        true,
      ),

    update: (id: string, data: SaveProductVariationRequest) =>
      apiRequest<ProductVariation>(
        "PATCH",
        `/product-variation/${id}`,
        data,
        true,
      ),

    delete: (id: string) =>
      apiRequest<ProductVariation>(
        "DELETE",
        `/product-variation/${id}`,
        undefined,
        true,
      ),
  },

  // Category endpoints
  // Listagem pública (para a tela /restaurants do cliente) - Todos têm acesso
  getAllCategories: () => apiRequest<Category[]>("GET", "/categories"),

  // Listagem administrativa (Painel da Empresa) - Exige auth (Admin, Owner, Manager)
  getMyCategories: (params?: PaginationParams) =>
    apiRequest<PaginatedResponse<Category>>(
      "GET",
      withPagination("/categories/me", params),
      undefined,
      true,
    ),

  getCategory: (id: string) => apiRequest<Category>("GET", `/categories/${id}`),

  // Modificações - Exigem auth (Admin, Owner, Manager)
  createMyCategory: (categoryData: CreateCategoryRequest) =>
    apiRequest<Category>("POST", "/categories/me", categoryData, true),

  updateMyCategory: (id: string, categoryData: CreateCategoryRequest) =>
    apiRequest<Category>("PATCH", `/categories/me/${id}`, categoryData, true),

  // Remoção-Apenas Admin e Owner podem deletar (Manager recebe 403)
  deleteMyCategory: (id: string) =>
    apiRequest<Category>("DELETE", `/categories/me/${id}`, undefined, true),
  // Legacy global category endpoints
  createCategory: (categoryData: CreateCategoryRequest) =>
    apiRequest<Category>("POST", "/categories/me", categoryData, true),

  updateCategory: (id: string, categoryData: CreateCategoryRequest) =>
    apiRequest<Category>("PUT", `/categories/me/${id}`, categoryData, true),

  deleteCategory: (id: string) =>
    apiRequest<Category>("DELETE", `/categories/me/${id}`, undefined, true),

  assignCategoryToCompany: (categoryId: string) =>
    apiRequest<Category>(
      "POST",
      `/categories/company/${categoryId}`,
      undefined,
      true,
    ),

  // Category-Product endpoints (link/unlink categories to products)
  linkCategoryToProduct: (
    productId: string,
    categoryId: string,
    description: string,
  ) =>
    apiRequest<any>(
      "POST",
      `/category-product/${productId}/${categoryId}`,
      { description },
      true,
    ),

  // Rota exige productId + categoryId juntos (não o id da relação
  // productCategories) - ver category-product.md.
  unlinkCategoryFromProduct: (productId: string, categoryId: string) =>
    apiRequest<any>(
      "DELETE",
      `/category-product/${productId}/${categoryId}`,
      undefined,
      true,
    ),

  // Speciality endpoints (restaurant types)
  // Apesar do doc dizer que é rota pública, o backend real exige token aqui
  // (confirmado: 401 "Token inválido ou ausente." mesmo sem nenhum guard
  // documentado). Único caller hoje é /company-profile (owner/admin, sempre
  // autenticado), então é seguro exigir auth.
  getAllSpecialities: () =>
    apiRequest<Speciality[]>("GET", "/specialities", undefined, true),

  getCompaniesBySpeciality: (specialityId: string) =>
    apiRequest<Company[]>("GET", `/specialities/${specialityId}/companies`),

  assignSpecialityToCompany: (specialityId: string) =>
    apiRequest<Company>(
      "POST",
      `/specialities/${specialityId}`,
      undefined,
      true,
    ),

  removeSpecialityFromCompany: (specialityId: string) =>
    apiRequest<Company>(
      "DELETE",
      `/specialities/${specialityId}`,
      undefined,
      true,
    ),

  // Company endpoints
  companies: {
    // O cookie de sessão já foi setado pelo /api/auth/register - o proxy
    // injeta o Bearer sozinho, não precisa mais de token explícito aqui.
    // POST /company exige multipart/form-data (ver company.md) - mandar
    // JSON aqui fazia o cadastro de empresa falhar silenciosamente logo
    // após criar a conta, deixando o usuário preso como 'client' pra
    // sempre (a promoção pra 'owner' só acontece dentro desse POST).
    create: async (
      companyData: CreateCompanyRequest,
    ): Promise<ApiResponse<Company>> => {
      try {
        const formData = new FormData();

        Object.entries(companyData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const config: RequestInit = {
          method: "POST",
          headers: { "X-Auth-Required": "1" },
          body: formData, // Não definir Content-Type - deixa o browser definir com boundary
        };

        const response = await fetch(`${API_BASE_URL}/company`, config);
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          return {
            success: false,
            message: result?.message || `Erro ${response.status}`,
            status: response.status,
          };
        }

        return { success: true, data: result, status: response.status };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erro ao cadastrar empresa",
        };
      }
    },

    getAll: (userLocation?: Coords) =>
      apiRequest<Restaurant[]>(
        "GET",
        userLocation
          ? `/company?lat=${userLocation.lat}&lng=${userLocation.lng}`
          : "/company",
      ),

    getById: (id: string) => apiRequest<Company>("GET", `/company/${id}`),

    update: async (
      id: string,
      companyData: Partial<CreateCompanyRequest>,
    ): Promise<ApiResponse<Company>> => {
      try {
        // Backend usa FileFieldsInterceptor, então precisa ser multipart/form-data
        const formData = new FormData();

        // Adicionar apenas os campos que foram enviados
        Object.entries(companyData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const config: RequestInit = {
          method: "PATCH",
          headers: { "X-Auth-Required": "1" },
          body: formData, // Não definir Content-Type - deixa o browser definir com boundary
        };

        const response = await fetch(`${API_BASE_URL}/company/${id}`, config);
        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            message: result.message || `Erro ${response.status}`,
            data: undefined,
          };
        }

        return {
          success: true,
          data: result,
          message: undefined,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erro ao atualizar empresa",
          data: undefined,
        };
      }
    },
  },

  // Upload endpoint (S3)
  uploadImage: async (
    file: File,
    folder: string = "products",
  ): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch(`${API_BASE_URL}/s3/upload`, {
        method: "POST",
        headers: { "X-Auth-Required": "1" },
        body: formData,
      });

      if (!response.ok) {
        return {
          success: false,
          message: "Erro ao fazer upload da imagem",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao fazer upload da imagem",
      };
    }
  },

  // Upload user photo via PUT /user endpoint
  uploadUserPhoto: async (
    file: File,
    userData?: { name?: string; email?: string; cpf?: string; phone?: string },
  ): Promise<ApiResponse<User>> => {
    try {
      let dataToSend: any = {};

      // Se userData foi passado, usar esses dados
      if (userData && Object.keys(userData).length > 0) {
        dataToSend = userData;
      } else {
        // Buscar dados do Zustand store (salvos no login com todos os campos)
        const userFromStorage = getAuthUser();
        if (userFromStorage) {
          dataToSend = {
            name: userFromStorage.name || "",
          };
        }
      }

      const formData = new FormData();
      formData.append("photo", file);

      // Adicionar apenas o nome para satisfazer validação do backend
      // Não enviamos email, cpf ou phone para evitar conflito de unicidade
      if (dataToSend.name) formData.append("name", dataToSend.name);

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "PUT",
        headers: { "X-Auth-Required": "1" },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Erro ao fazer upload da foto",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao fazer upload da foto",
      };
    }
  },

  // Upload company logo via PATCH /company/:id endpoint
  uploadCompanyLogo: async (
    file: File,
    companyId: string,
    companyData?: {
      tradeName?: string;
      legalName?: string;
      cnpj?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<ApiResponse<Company>> => {
    try {
      let dataToSend: any = {};

      // Se companyData foi passado, usar esses dados
      if (companyData && Object.keys(companyData).length > 0) {
        dataToSend = companyData;
      } else {
        // Buscar dados do localStorage (salvos no login com todos os campos)
        const userFromStorage = getAuthUser();
        if (userFromStorage) {
          dataToSend = {
            tradeName: userFromStorage.tradeName || "",
            legalName: userFromStorage.legalName || "",
            cnpj: userFromStorage.cnpj || "",
            email: userFromStorage.email || "",
            phone: userFromStorage.phone || "",
          };
        }
      }

      const formData = new FormData();
      formData.append("logo", file);

      // Adicionar campos obrigatórios para evitar erro de validação do backend
      if (dataToSend.tradeName)
        formData.append("tradeName", dataToSend.tradeName);
      if (dataToSend.legalName)
        formData.append("legalName", dataToSend.legalName);
      if (dataToSend.cnpj) formData.append("cnpj", dataToSend.cnpj);
      if (dataToSend.email) formData.append("email", dataToSend.email);
      if (dataToSend.phone) formData.append("phone", dataToSend.phone);

      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: "PATCH",
        headers: { "X-Auth-Required": "1" },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Erro ao fazer upload do logo",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao fazer upload do logo",
      };
    }
  },

  // Upload company cover via PATCH /company/:id endpoint
  uploadCompanyCover: async (
    file: File,
    companyId: string,
    companyData?: {
      tradeName?: string;
      legalName?: string;
      cnpj?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<ApiResponse<Company>> => {
    try {
      let dataToSend: any = {};

      // Se companyData foi passado, usar esses dados
      if (companyData && Object.keys(companyData).length > 0) {
        dataToSend = companyData;
      } else {
        // Buscar dados do localStorage (salvos no login com todos os campos)
        const userFromStorage = getAuthUser();
        if (userFromStorage) {
          dataToSend = {
            tradeName: userFromStorage.tradeName || "",
            legalName: userFromStorage.legalName || "",
            cnpj: userFromStorage.cnpj || "",
            email: userFromStorage.email || "",
            phone: userFromStorage.phone || "",
          };
        }
      }

      const formData = new FormData();
      formData.append("cover", file);

      // Adicionar campos obrigatórios para evitar erro de validação do backend
      if (dataToSend.tradeName)
        formData.append("tradeName", dataToSend.tradeName);
      if (dataToSend.legalName)
        formData.append("legalName", dataToSend.legalName);
      if (dataToSend.cnpj) formData.append("cnpj", dataToSend.cnpj);
      if (dataToSend.email) formData.append("email", dataToSend.email);
      if (dataToSend.phone) formData.append("phone", dataToSend.phone);

      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: "PATCH",
        headers: { "X-Auth-Required": "1" },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Erro ao fazer upload do cover",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao fazer upload do cover",
      };
    }
  },

  // Address endpoints
  // Contrato oficial (doc do backend): TUDO vive sob /address/me agora -
  // listar, criar, atualizar (/address/me/:id) e deletar (/address/me/:id).
  // Antes atualizar/deletar eram direto em /address/:id (sem /me); o back
  // mudou isso.
  address: {
    // User addresses
    getUserAddresses: () =>
      apiRequest<Address[]>("GET", "/address/me", undefined, true),

    createUserAddress: (addressData: CreateAddressRequest) =>
      apiRequest<Address>("POST", "/address/me", addressData, true),

    updateUserAddress: (id: string, addressData: UpdateAddressRequest) =>
      apiRequest<Address>("PATCH", `/address/me/${id}`, addressData, true),

    // Soft delete - backend marca isActive: false, não remove o registro.
    deleteUserAddress: (id: string) =>
      apiRequest<Address>("DELETE", `/address/me/${id}`, undefined, true),

    // Backward compatibility alias
    deleteAddress: (id: string) =>
      apiRequest<Address>("DELETE", `/address/me/${id}`, undefined, true),

    // Company addresses
    getCompanyAddresses: () =>
      apiRequest<Address[]>("GET", "/address/me", undefined, true),

    createCompanyAddress: (addressData: CreateAddressRequest) =>
      apiRequest<Address>("POST", "/address/me", addressData, true),

    updateCompanyAddress: (id: string, addressData: UpdateAddressRequest) =>
      apiRequest<Address>("PATCH", `/address/me/${id}`, addressData, true),

    deleteCompanyAddress: (id: string) =>
      apiRequest<Address>("DELETE", `/address/me/${id}`, undefined, true),
  },

  // Order endpoints
  orders: {
    openCart: (_customerId: string, orderData: CreateOrderRequest) =>
      apiRequest<Order>("POST", `/order`, orderData, true),

    viewOrder: (_customerId: string, orderId: string) =>
      apiRequest<Order>(
        "GET",
        `/order/${encodeOrderId(orderId)}`,
        undefined,
        true,
      ),

    finishOrder: (_customerId: string, orderId: string) =>
      apiRequest<Order>(
        "POST",
        `/order/${encodeOrderId(orderId)}`,
        undefined,
        true,
      ),

    clearCart: (_customerId: string, orderId: string) =>
      apiRequest<void>(
        "DELETE",
        `/order/${encodeOrderId(orderId)}`,
        undefined,
        true,
      ),

    // Pedidos do cliente logado. Role `client` - o backend resolve o
    // customerId pelo JWT.
    getCustomerOrders: () =>
      apiRequest<Order[]>("GET", "/order/customer/me", undefined, true),

    getCustomerOrder: (orderId: string) =>
      apiRequest<Order>(
        "GET",
        `/order/customer/me/${encodeOrderId(orderId)}`,
        undefined,
        true,
      ),

    // Atencao: `/order/abandoned` exige role admin/owner/manager.
    // Nao use para listar pedidos de um cliente - ele recebe 403.
    listAbandonedOrders: (customerId?: string) =>
      apiRequest<Order[]>(
        "GET",
        `/order/abandoned${customerId ? `?customerId=${customerId}` : ""}`,
        undefined,
        true,
      ),

    getCompanyOrders: (params?: OrderDateRangeParams) =>
      apiRequest<PaginatedResponse<Order>>(
        "GET",
        withOrderDateRange("/order/company", params),
        undefined,
        true,
      ),

    getCompanyOrdersByStatus: (status: string, params?: OrderDateRangeParams) =>
      apiRequest<PaginatedResponse<Order>>(
        "GET",
        withOrderDateRange(`/order/company/status/${status}`, params),
        undefined,
        true,
      ),

    updateOrderStatus: (
      orderId: string,
      status: string,
      cancelReason?: string,
    ) =>
      apiRequest<Order>(
        "PATCH",
        `/order/${orderId}/status`,
        { status, ...(cancelReason ? { cancelReason } : {}) },
        true,
      ),

    cancelOrder: (orderId: string, reason: string) =>
      apiRequest<Order>("PATCH", `/order/${orderId}/cancel`, { reason }, true),
  },

  // Order Item endpoints
  orderItems: {
    getOrderItem: (orderId: string, itemId: string, customerId?: string) =>
      apiRequest<OrderItem>(
        "GET",
        `/order-item/${itemId}${customerId ? `?customerId=${customerId}&orderId=${orderId}` : ""}`,
        undefined,
        true,
      ),

    listByOrder: (orderId: string, customerId?: string) =>
      apiRequest<OrderItem[]>(
        "GET",
        `/order-item/order/${encodeURIComponent(orderId)}${customerId ? `?customerId=${customerId}` : ""}`,
        undefined,
        true,
      ),

    addProductToCart: (
      orderId: string,
      productId: string,
      _customerId: string,
      quantity: number,
      extras?: {
        addOns?: { productAddOnsId: string; quantity: number }[];
        variations?: { productVariationId: string }[];
      },
    ) =>
      apiRequest<Order>(
        "POST",
        `/order-item/cart`,
        {
          orderId,
          productId,
          quantity,
          ...(extras?.addOns?.length ? { addOns: extras.addOns } : {}),
          ...(extras?.variations?.length
            ? { variations: extras.variations }
            : {}),
        },
        true,
      ),

    removeProductFromCart: (
      _customerId: string,
      orderId: string,
      productId: string,
      quantity: number,
    ) =>
      apiRequest<void>(
        "DELETE",
        `/order-item/cart/${encodeOrderId(orderId)}/products/${productId}/${quantity}`,
        undefined,
        true,
      ),
  },

  // Ingredient endpoints
  ingredients: {
    get: (id: string) =>
      apiRequest<Ingredient>("GET", `/ingredient/${id}`, undefined, true),

    create: (ingredientData: CreateIngredientRequest) =>
      apiRequest<Ingredient>("POST", "/ingredient", ingredientData, true),

    update: (id: string, ingredientData: UpdateIngredientRequest) =>
      apiRequest<Ingredient>(
        "PATCH",
        `/ingredient/${id}`,
        ingredientData,
        true,
      ),

    delete: (id: string) =>
      apiRequest<Ingredient>("DELETE", `/ingredient/${id}`, undefined, true),
  },

  // Payment endpoints
  payments: {
    create: (paymentData: CreatePaymentRequest) =>
      apiRequest<Payment>("POST", "/payment", paymentData, true),

    findById: (id: string) =>
      apiRequest<Payment>("GET", `/payment/${id}`, undefined, true),

    findByFilters: (
      filters: { id?: string; orderId?: string; customerId?: string },
      params?: PaginationParams,
    ) =>
      apiRequest<PaginatedResponse<Payment>>(
        "GET",
        withPagination(
          `/payment?${new URLSearchParams(filters as Record<string, string>).toString()}`,
          params,
        ),
        undefined,
        true,
      ),

    findByMethod: (paymentMethod: PaymentMethod, params?: PaginationParams) =>
      apiRequest<PaginatedResponse<Payment>>(
        "GET",
        withPagination(
          `/payment/filter/by-method?paymentMethod=${paymentMethod}`,
          params,
        ),
        undefined,
        true,
      ),

    findByDateRange: (
      startDate: string,
      endDate: string,
      customerId?: string,
      params?: PaginationParams,
    ) =>
      apiRequest<PaginatedResponse<Payment>>(
        "GET",
        withPagination(
          `/payment/filter/by-date?startDate=${startDate}&endDate=${endDate}${customerId ? `&customerId=${customerId}` : ""}`,
          params,
        ),
        undefined,
        true,
      ),

    // Aprovar/rejeitar/estornar passam por /financial/... - as rotas
    // equivalentes em /payment/... são legadas e agora restritas no backend
    // para evitar bypass de regra de negócio (ver financial.md).
    approve: (id: string, transaction?: string) =>
      apiRequest<Payment>(
        "PATCH",
        `/financial/payment/${id}/approve`,
        transaction ? { transaction } : undefined,
        true,
      ),

    reject: (id: string) =>
      apiRequest<Payment>(
        "PATCH",
        `/financial/payment/${id}/reject`,
        undefined,
        true,
      ),

    update: (id: string, paymentData: UpdatePaymentRequest) =>
      apiRequest<Payment>("PATCH", `/payment/${id}`, paymentData, true),
    delete: (id: string) =>
      apiRequest<Payment>("DELETE", `/payment/${id}`, undefined, true),
    financialRefund: (id: string) =>
      apiRequest<Payment>(
        "PATCH",
        `/financial/payment/${id}/refund`,
        undefined,
        true,
      ),
  },

  // Delivery endpoints
  deliveries: {
    getAll: () => apiRequest<Delivery[]>("GET", "/delivery", undefined, true),

    getById: (id: string) =>
      apiRequest<Delivery>("GET", `/delivery/${id}`, undefined, true),

    create: (deliveryData: CreateDeliveryRequest) =>
      apiRequest<Delivery>("POST", "/delivery", deliveryData, true),

    updateStatus: (id: string, status: string) =>
      apiRequest<Delivery>("PATCH", `/delivery/${id}/status`, { status }, true),

    cancel: (id: string, reason: string, observations?: string) =>
      apiRequest<Delivery>(
        "PATCH",
        `/delivery/${id}/cancel`,
        { reason, ...(observations ? { observations } : {}) },
        true,
      ),

    // Customer endpoints (authenticated)
    getCustomerDeliveries: () =>
      apiRequest<Delivery[]>("GET", "/delivery/customer/me", undefined, true),

    getCustomerDeliveriesByStatus: (status: string) =>
      apiRequest<Delivery[]>(
        "GET",
        `/delivery/customer/me/status/${status}`,
        undefined,
        true,
      ),

    getCustomerDeliveryById: (id: string) =>
      apiRequest<Delivery>(
        "GET",
        `/delivery/customer/me/${id}`,
        undefined,
        true,
      ),

    // Company endpoints (authenticated)
    getCompanyDeliveries: () =>
      apiRequest<Delivery[]>("GET", "/delivery/company", undefined, true),

    getCompanyDeliveriesByStatus: (status: string) =>
      apiRequest<Delivery[]>(
        "GET",
        `/delivery/company/status/${status}`,
        undefined,
        true,
      ),

    // Calculate delivery cost
    calculateDeliveryCost: (deliveryId: string) =>
      apiRequest<{ cost: number }>(
        "GET",
        `/delivery/${deliveryId}/calculate`,
        undefined,
        true,
      ),

    // Delivery-person endpoints (authenticated, role delivery)
    // Devolve PENDING (disponíveis pra aceitar) + as próprias, qualquer status.
    getMyDeliveries: () =>
      apiRequest<Delivery[]>(
        "GET",
        "/delivery/delivery-person/me",
        undefined,
        true,
      ),

    getMyDeliveriesByStatus: (status: string) =>
      apiRequest<Delivery[]>(
        "GET",
        `/delivery/delivery-person/me/status/${status}`,
        undefined,
        true,
      ),
  },
  // Cash Movement endpoints
  cashMovement: {
    getSummary: () =>
      apiRequest<CashMovementSummary>(
        "GET",
        "/cash-movement/summary/current",
        undefined,
        true,
      ),
    withdrawal: (data: CashWithdrawalRequest) =>
      apiRequest<any>("POST", "/cash-movement/withdrawal", data, true),
    deposit: (data: CashDepositRequest) =>
      apiRequest<any>("POST", "/cash-movement/deposit", data, true),
    sale: (data: CashSaleRequest) =>
      apiRequest<any>("POST", "/cash-movement/sale", data, true),
    refund: (data: CashRefundRequest) =>
      apiRequest<any>("POST", "/cash-movement/refund", data, true),
  },
  // Cash Register endpoints
  cashRegister: {
    getCurrentOpen: () =>
      apiRequest<CashRegister>(
        "GET",
        "/cash-register/open/current",
        undefined,
        true,
      ),
    open: (data: OpenCashRegisterRequest) =>
      apiRequest<CashRegister>("POST", "/cash-register/open", data, true),
    close: (data: CloseCashRegisterRequest) =>
      apiRequest<CashRegister>("POST", "/cash-register/close", data, true),
  },
  // Reports endpoints
  reports: {
    getSummary: (params?: ReportsParams) => {
      const query = params
        ? "?" +
          new URLSearchParams(
            Object.fromEntries(
              Object.entries(params).filter(([, v]) => v !== undefined),
            ) as Record<string, string>,
          ).toString()
        : "";
      return apiRequest<ReportsSummary>(
        "GET",
        `/reports${query}`,
        undefined,
        true,
      );
    },
  },
};
