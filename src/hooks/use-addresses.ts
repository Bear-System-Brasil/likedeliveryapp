import { apiService, type Address } from "@/services/api";
import { useAuthStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook para buscar endereços do usuário
 */
export const useUserAddresses = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["addresses", "user", user?.id],
    queryFn: async () => {
      const response = await apiService.address.getUserAddresses();
      if (!response.success || !response.data) {
        return [];
      }

      // Backend agora sempre retorna array
      const addressesData = Array.isArray(response.data) ? response.data : [];

      // Filtro por usuário
      const userAddresses = addressesData.filter(
        (addr: Address) => addr.customerId === user?.id,
      );

      return userAddresses;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para criar um endereço
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (addressData: any) => {
      // If new address is default, uncheck all others first
      if (addressData.isDefault === true) {
        try {
          const addressesResponse = await apiService.address.getUserAddresses();
          if (addressesResponse.success && addressesResponse.data) {
            const addresses = Array.isArray(addressesResponse.data)
              ? addressesResponse.data
              : [];
            const defaultAddresses = addresses.filter((addr) => addr.isDefault);

            // Uncheck all existing default addresses
            for (const addr of defaultAddresses) {
              try {
                await apiService.address.updateUserAddress(addr.id, {
                  zipCode: addr.zipCode,
                  state: addr.state,
                  city: addr.city,
                  neighborhood: addr.neighborhood,
                  street: addr.street,
                  number: addr.number,
                  complement: addr.complement,
                  reference: addr.reference,
                  latitude: addr.latitude,
                  longitude: addr.longitude,
                  isDefault: false,
                });
              } catch (error) {
                // Continue even if one fails
              }
            }
          }
        } catch (error) {
          // Continue with address creation
        }
      }

      const response = await apiService.address.createUserAddress(addressData);
      if (!response.success) {
        throw new Error("Falha ao criar endereço");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["addresses", "user", user?.id],
      });
      toast.success("Endereço criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar endereço");
    },
  });
};

/**
 * Hook para atualizar um endereço
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // 1. Se está marcando como padrão, desmarcar os outros usando o cache (muito mais rápido)
      if (data.isDefault === true) {
        let currentAddresses =
          queryClient.getQueryData<Address[]>(["addresses", "user", user?.id]) ??
          [];

        if (currentAddresses.length === 0) {
          const res = await apiService.address.getUserAddresses();
          currentAddresses =
            res.success && Array.isArray(res.data) ? res.data : [];
        }
        const defaultAddresses = currentAddresses.filter(
          (addr) => addr.isDefault && addr.id !== id,
        );

        await Promise.allSettled(
          defaultAddresses.map((addr) =>
            apiService.address.updateUserAddress(addr.id, {
              latitude: addr.latitude,
              longitude: addr.longitude,
              isDefault: false,
            }),
          ),
        );
      }

      // 2. Atualiza o endereço principal
      const response = await apiService.address.updateUserAddress(id, data);

      if (!response.success) {
        throw new Error(response.message || "Falha ao atualizar endereço");
      }

      return response.data;
    },

    // Optimistic update – UI responde imediatamente
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: ["addresses", "user", user?.id],
      });

      const previousAddresses = queryClient.getQueryData([
        "addresses",
        "user",
        user?.id,
      ]);

      queryClient.setQueryData(
        ["addresses", "user", user?.id],
        (old: any[] = []) => {
          // Se está marcando como padrão, desmarca os outros no cache também
          let updated = old.map((addr) =>
            addr.id === id ? { ...addr, ...data } : addr,
          );

          if (data.isDefault === true) {
            updated = updated.map((addr) =>
              addr.id !== id && addr.isDefault
                ? { ...addr, isDefault: false }
                : addr,
            );
          }

          return updated;
        },
      );

      return { previousAddresses };
    },

    onError: (error: Error, _variables, context) => {
      // Rollback em caso de erro
      if (context?.previousAddresses) {
        queryClient.setQueryData(
          ["addresses", "user", user?.id],
          context.previousAddresses,
        );
      }
      toast.error(error.message || "Erro ao atualizar endereço");
    },

    onSuccess: (data, variables) => {
      // Garante que o cache do endereço individual fique sincronizado (a lista é invalidada no onSettled)
      queryClient.invalidateQueries({ queryKey: ["address", variables.id] });
      toast.success("Endereço atualizado com sucesso!");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["addresses", "user", user?.id],
      });
    },
  });
};

/**
 * Hook para deletar um endereço
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiService.address.deleteUserAddress(addressId);
      if (!response.success) {
        throw new Error("Falha ao deletar endereço");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["addresses", "user", user?.id],
      });
      toast.success("Endereço deletado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar endereço");
    },
  });
};

/**
 * Hook para buscar endereço via CEP (ViaCEP)
 */
export const useViaCep = () => {
  return useMutation({
    mutationFn: async (zipCode: string) => {
      const cleanZipCode = zipCode.replace(/\D/g, "");

      if (cleanZipCode.length !== 8) {
        throw new Error("CEP inválido");
      }

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanZipCode}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: cleanZipCode,
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao buscar CEP");
    },
  });
};
