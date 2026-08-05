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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://like-delivery-backend.onrender.com";

/**
 * Helper para obter token de autenticação
 * Tenta primeiro do Zustand store, depois fallback para formato legado
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    // Tentar pegar do Zustand store
    const authData = storageManager.local.get<any>(STORAGE_KEYS.AUTH);
    if (authData?.state?.token) {
      return authData.state.token;
    }

    // Fallback para formato legado
    const legacyToken = storageManager.local.get<string>(
      STORAGE_KEYS.LEGACY_TOKEN,
    );
    return legacyToken;
  } catch {
    return null;
  }
};

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

export interface LoginResponse {
  token: string;
  user: User | Company;
  type: "customer" | "company";
}

export interface LoginApiResponse {
  data: LoginResponse;
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

    // Add authorization token if needed
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401 && requiresAuth) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return {
        success: false,
        message: "Sessão expirada. Faça login novamente.",
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
      // Skip 404 logging on viewOrder - expected when no cart exists
      const is404OnViewOrder =
        response.status === 404 &&
        endpoint.includes("/order/") &&
        method === "GET";

      if (!is404OnViewOrder) {
        if (process.env.NODE_ENV !== "production") {
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            method,
          });
        }
      }

      // Se não tem resultado (204 ou sem conteúdo), usar mensagem padrão
      if (!result) {
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

      return { success: false, message: errorMessage };
    }

    return { success: true, data: result };
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
  latitude?: number | string;
  longitude?: number | string;
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
  latitude?: number | string;
  longitude?: number | string;
  isDefault?: boolean;
}

// Order types
export interface Order {
  id: string;
  customerId: string;
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
  customerId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
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

  getMe: () => apiRequest<User>("GET", "/user/me", undefined, true),

  // Auth endpoints
  register: (userData: CreateUserRequest) =>
    apiRequest<LoginApiResponse>("POST", "/auth/register", userData),

  login: (credentials: { email: string; password: string }) =>
    apiRequest<LoginApiResponse>("POST", "/auth/login", credentials),

  getInitialPhone: () =>
    apiRequest<{ phone: string }>("GET", "/auth/login/initial"),

  completeLogin: (data: { phone: string; code: string }) =>
    apiRequest<LoginResponse>("POST", "/auth/login/complet", data),

  // Password recovery endpoints
  forgotPassword: (data: { email: string }) =>
    apiRequest<{ message: string }>("POST", "/auth/forgot-password", data),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    apiRequest<{ message: string }>("POST", "/auth/reset-password", data),

  // Product endpoints
  getAllProducts: () => apiRequest<Product[]>("GET", "/product"),

  getProduct: (id: string) => apiRequest<Product>("GET", `/product/${id}`),

  getProductsByCompany: (companyId: string) =>
    apiRequest<Product[]>("GET", `/product/company/${companyId}`),

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

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/product/image/${productId}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // Category endpoints
  // Listagem pública (para a tela /restaurants do cliente) - Todos têm acesso
  getAllCategories: () => apiRequest<Category[]>("GET", "/categories"),

  // Listagem administrativa (Painel da Empresa) - Exige auth (Admin, Owner, Manager)
  getMyCategories: () =>
    apiRequest<Category[]>("GET", "/categories/me", undefined, true),

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

  unlinkCategoryFromProduct: (categoryProductId: string) =>
    apiRequest<any>(
      "DELETE",
      `/category-product/${categoryProductId}`,
      undefined,
      true,
    ),

  // Speciality endpoints (restaurant types)
  getAllSpecialities: () => apiRequest<Speciality[]>("GET", "/specialities"),

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
    create: (companyData: CreateCompanyRequest, token?: string) =>
      token
        ? // Use provided token (e.g. from fresh registration)
          fetch(`${API_BASE_URL}/company`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(companyData),
          }).then(async (res): Promise<ApiResponse<Company>> => {
            const result = await res.json();
            if (!res.ok) {
              const msg = Array.isArray(result.message)
                ? result.message[0]
                : typeof result.message === "string"
                  ? result.message
                  : `Erro ${res.status}`;
              return { success: false, message: msg };
            }
            return { success: true, data: result };
          })
        : apiRequest<Company>("POST", "/company", companyData, true),

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

        const token = getAuthToken();
        const config: RequestInit = {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/s3/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  address: {
    // User addresses
    getUserAddresses: () =>
      apiRequest<Address[]>("GET", "/address/me", undefined, true),

    createUserAddress: (addressData: CreateAddressRequest) =>
      apiRequest<Address>("POST", "/address/me", addressData, true),

    updateUserAddress: (id: string, addressData: UpdateAddressRequest) =>
      apiRequest<Address>("PATCH", `/address/me/${id}`, addressData, true),

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

    listAbandonedOrders: (customerId?: string) =>
      apiRequest<Order[]>(
        "GET",
        `/order/abandoned${customerId ? `?customerId=${customerId}` : ""}`,
        undefined,
        true,
      ),

    getCompanyOrders: () =>
      apiRequest<Order[]>("GET", "/order/company", undefined, true),

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
    ) =>
      apiRequest<Order>(
        "POST",
        `/order-item/cart`,
        { orderId, productId, quantity },
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

    findByFilters: (filters: {
      id?: string;
      orderId?: string;
      customerId?: string;
    }) =>
      apiRequest<Payment[]>(
        "GET",
        `/payment?${new URLSearchParams(filters as Record<string, string>).toString()}`,
        undefined,
        true,
      ),

    findByMethod: (paymentMethod: PaymentMethod) =>
      apiRequest<Payment[]>(
        "GET",
        `/payment/filter/by-method?paymentMethod=${paymentMethod}`,
        undefined,
        true,
      ),

    findByDateRange: (
      startDate: string,
      endDate: string,
      customerId?: string,
    ) =>
      apiRequest<Payment[]>(
        "GET",
        `/payment/filter/by-date?startDate=${startDate}&endDate=${endDate}${customerId ? `&customerId=${customerId}` : ""}`,
        undefined,
        true,
      ),

    approve: (id: string, transaction?: string) =>
      apiRequest<Payment>(
        "PATCH",
        `/payment/${id}/approve`,
        transaction ? { transaction } : undefined,
        true,
      ),

    reject: (id: string) =>
      apiRequest<Payment>("PATCH", `/payment/${id}/reject`, undefined, true),

    update: (id: string, paymentData: UpdatePaymentRequest) =>
      apiRequest<Payment>("PATCH", `/payment/${id}`, paymentData, true),
    delete: (id: string) =>
      apiRequest<Payment>("DELETE", `/payment/${id}`, undefined, true),
    financialRefund: (id: string) =>
      apiRequest<Payment>(
        "POST",
        `/payment/${id}/financial-refund`,
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

    cancel: (id: string, reason: string) =>
      apiRequest<Delivery>(
        "PATCH",
        `/delivery/${id}/status`,
        { status: "CANCELED", cancelReason: reason },
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
  },
  // Cash Movement endpoints
  cashMovement: {
    getSummary: () =>
      apiRequest<CashMovementSummary>(
        "GET",
        "/cash-movement/summary",
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
        "/cash-register/current",
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
