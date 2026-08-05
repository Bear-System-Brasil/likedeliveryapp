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
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar produtos por empresa
 * Otimizado com cache agressivo
 */
export const useCompanyProducts = (companyId: string | null) => {
  return useQuery({
    queryKey: ["products", "company", companyId],
    queryFn: () => getCompanyProducts(companyId!), // safe por causa do enabled
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
  });
};

/**
 * Hook para buscar detalhes de um produto
 * Otimizado com cache agressivo
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
    staleTime: 15 * 60 * 1000, // 15 minutos - dados de produto são estáveis
    gcTime: 60 * 60 * 1000, // 1 hora
  });
};

/**
 * Hook para criar um produto
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiService.createProduct(productData);
      if (!response.success) {
        throw new Error("Falha ao criar produto");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
        throw new Error("Falha ao atualizar produto");
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
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
        // Cria erro com mensagem para melhor tratamento
        const error = new Error(response.message || "Falha ao deletar produto") as any;
        error.errorMessage = response.message;
        throw error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
