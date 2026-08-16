import { apiService } from "@/services/api";
import { getCompanyProducts } from "@/services/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook para buscar todos os produtos
 */
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiService.getAllProducts();
      if (!response.success || !response.data) {
        throw new Error("Falha ao carregar produtos");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Hook para buscar produtos por empresa
 * Cache agressivo — ideal pra cardápio
 */
export const useCompanyProducts = (companyId: string | null) => {
  return useQuery({
    queryKey: ["products", "company", companyId],
    queryFn: () => getCompanyProducts(companyId!),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 60 * 60 * 1000, // 1h
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para buscar detalhes de um produto
 */
export const useProduct = (productId: string | null) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      const response = await apiService.getProduct(productId);
      if (!response.success || !response.data) {
        throw new Error("Falha ao carregar produto");
      }
      return response.data;
    },
    enabled: !!productId,
    staleTime: 15 * 60 * 1000, // 15 min
    gcTime: 60 * 60 * 1000,
  });
};

/**
 * Helper: invalida todas as queries relacionadas a produtos
 */
function invalidateProductQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { productId?: string; companyId?: string },
) {
  // Lista geral
  queryClient.invalidateQueries({ queryKey: ["products"] });

  // Lista por empresa (se soubermos a company)
  if (options?.companyId) {
    queryClient.invalidateQueries({
      queryKey: ["products", "company", options.companyId],
    });
  } else {
    // Se não souber, invalida todas as listas por empresa
    queryClient.invalidateQueries({
      queryKey: ["products", "company"],
    });
  }

  // Produto individual
  if (options?.productId) {
    queryClient.invalidateQueries({
      queryKey: ["product", options.productId],
    });
  }
}

/**
 * Hook para criar um produto
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiService.createProduct(productData);
      if (!response.success) {
        throw new Error(response.message || "Falha ao criar produto");
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      invalidateProductQueries(queryClient, {
        companyId: variables.companyId ?? variables.company?.id,
      });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });
};

/**
 * Hook para atualizar um produto
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiService.updateProduct(id, data);
      if (!response.success) {
        throw new Error(response.message || "Falha ao atualizar produto");
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      invalidateProductQueries(queryClient, {
        productId: variables.id,
        companyId: variables.data?.companyId ?? data?.companyId,
      });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });
};

/**
 * Hook para deletar um produto
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiService.deleteProduct(productId);
      if (!response.success) {
        const error = new Error(
          response.message || "Falha ao deletar produto",
        ) as any;
        error.errorMessage = response.message;
        throw error;
      }
      return response.data;
    },
    onSuccess: (_data, productId) => {
      invalidateProductQueries(queryClient, { productId });
      toast.success("Produto removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(
        error.errorMessage || error.message || "Erro ao deletar produto",
      );
    },
  });
};
