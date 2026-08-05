import { apiService } from "../api";

export async function getRestaurant(restaurantId: string) {
  if (!restaurantId) throw new Error("Restaurant ID is required");

  const response = await apiService.companies.getById(restaurantId);

  if (!response.success || !response.data) {
    throw new Error("Restaurante não encontrado");
  }
  return response.data;
}
