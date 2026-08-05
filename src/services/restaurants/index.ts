import { Coords, Restaurant } from "@/types/restaurant";
import { apiService } from "@/services/api";

export async function getActiveRestaurants(userLocation?: Coords) {
  const response = await apiService.companies.getAll(userLocation);

  if (!response.success || !response.data) {
    throw new Error("Falha ao carregar restaurantes");
  }

  return response.data.filter(
    (company: Restaurant) => company.status === "active",
  );
}
