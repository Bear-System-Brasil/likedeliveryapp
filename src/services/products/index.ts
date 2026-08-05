import { apiService } from "../api";

export async function getCompanyProducts(companyId: string) {
  if (!companyId) throw new Error("Company ID is required");

  const response = await apiService.getProductsByCompany(companyId);

  if (!response.success || !response.data) {
    throw new Error("Falha ao carregar produtos");
  }

  return response.data;
}
