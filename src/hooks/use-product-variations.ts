import { apiService, type SaveProductVariationRequest } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook para buscar as variações (tamanhos) de um produto.
 * O backend ignora o filtro `productId` da query e devolve todas as
 * variações de todas as empresas - o filtro é feito aqui.
 */
export const useProductVariations = (productId: string | null) => {
  return useQuery({
    queryKey: ["product-variations", productId],
    queryFn: async () => {
      const response = await apiService.productVariations.getAll();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Falha ao carregar variações");
      }
      return response.data.filter(
        (variation) => variation.productId === productId,
      );
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Variante pro modal de personalização do prato (visível a visitante
 * não-logado navegando o cardápio) - não dispara o popup global de login
 * quando o backend exige token e o visitante ainda não tem um.
 */
export const usePublicProductVariations = (productId: string | null) => {
  return useQuery({
    queryKey: ["product-variations", "public", productId],
    queryFn: async () => {
      const response = await apiService.productVariations.getAllPublic();
      if (!response.success || !response.data) return [];
      return response.data.filter(
        (variation) => variation.productId === productId,
      );
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
};

export const useCreateProductVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string;
      data: SaveProductVariationRequest;
    }) => {
      const response = await apiService.productVariations.create(
        productId,
        data,
      );
      if (!response.success) {
        throw new Error(response.message || "Falha ao criar variação");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-variations", variables.productId],
      });
      toast.success("Variação criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar variação");
    },
  });
};

export const useUpdateProductVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      productId,
      data,
    }: {
      id: string;
      productId: string;
      data: SaveProductVariationRequest;
    }) => {
      const response = await apiService.productVariations.update(id, data);
      if (!response.success) {
        throw new Error(response.message || "Falha ao atualizar variação");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-variations", variables.productId],
      });
      toast.success("Variação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar variação");
    },
  });
};

export const useDeleteProductVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      productId: string;
    }) => {
      const response = await apiService.productVariations.delete(id);
      if (!response.success) {
        throw new Error(response.message || "Falha ao remover variação");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-variations", variables.productId],
      });
      toast.success("Variação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover variação");
    },
  });
};
