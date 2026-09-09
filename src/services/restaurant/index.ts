import { apiService } from "../api";
import type { Restaurant } from "@/types/restaurant";

/**
 * GET /company/:id devolve o mesmo formato rico usado na listagem pública
 * de restaurantes (rating, deliveryFee, endereços, etc.) - mais campos do
 * que o tipo `Company` (usado pelo dono da loja pra editar CNPJ/razão
 * social) declara. Pra tela pública de restaurante o formato certo é
 * `Restaurant`, igual ao de `getActiveRestaurants`.
 */
export async function getRestaurant(restaurantId: string): Promise<Restaurant> {
  if (!restaurantId) throw new Error("Restaurant ID is required");

  const response = await apiService.companies.getById(restaurantId);

  if (!response.success || !response.data) {
    throw new Error("Restaurante não encontrado");
  }
  return response.data as unknown as Restaurant;
}
