import { apiService, type Address } from '@/services/api'
import { useAuthStore } from '@/stores'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook para buscar endereços do usuário
 */
export const useUserAddresses = () => {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['addresses', 'user', user?.id],
    queryFn: async () => {
      const response = await apiService.address.getUserAddresses()
      if (!response.success || !response.data) {
        return []
      }

      // Backend agora sempre retorna array
      const addressesData = Array.isArray(response.data) ? response.data : []

      // Filtro por usuário
      const userAddresses = addressesData.filter((addr: Address) =>
        addr.customerId === user?.id
      )

      return userAddresses
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para criar um endereço
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (addressData: any) => {
      // If new address is default, uncheck all others first
      if (addressData.isDefault === true) {
        try {
          const addressesResponse = await apiService.address.getUserAddresses()
          if (addressesResponse.success && addressesResponse.data) {
            const addresses = Array.isArray(addressesResponse.data) ? addressesResponse.data : []
            const defaultAddresses = addresses.filter(addr => addr.isDefault)

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
                })
              } catch (error) {
                // Continue even if one fails
              }
            }
          }
        } catch (error) {
          // Continue with address creation
        }
      }

      const response = await apiService.address.createUserAddress(addressData)
      if (!response.success) {
        throw new Error('Falha ao criar endereço')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'user', user?.id] })
      toast.success('Endereço criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar endereço')
    },
  })
}

/**
 * Hook para atualizar um endereço
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Se está marcando como padrão, desmarcar todos os outros primeiro
      if (data.isDefault === true) {
        try {
          const addressesResponse = await apiService.address.getUserAddresses()
          if (addressesResponse.success && addressesResponse.data) {
            const addresses = Array.isArray(addressesResponse.data) ? addressesResponse.data : []
            const defaultAddresses = addresses.filter(addr => addr.isDefault && addr.id !== id)

            // Desmarcar todos os outros endereços padrão
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
                })
              } catch (error) {
                console.error('Erro ao desmarcar endereço padrão:', error)
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar endereços para desmarcar:', error)
        }
      }

      const response = await apiService.address.updateUserAddress(id, data)
      if (!response.success) {
        throw new Error('Falha ao atualizar endereço')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'user', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['address', variables.id] })
      toast.success('Endereço atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar endereço')
    },
  })
}

/**
 * Hook para deletar um endereço
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiService.address.deleteUserAddress(addressId)
      if (!response.success) {
        throw new Error('Falha ao deletar endereço')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'user', user?.id] })
      toast.success('Endereço deletado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar endereço')
    },
  })
}

/**
 * Hook para buscar endereço via CEP (ViaCEP)
 */
export const useViaCep = () => {
  return useMutation({
    mutationFn: async (zipCode: string) => {
      const cleanZipCode = zipCode.replace(/\D/g, '')

      if (cleanZipCode.length !== 8) {
        throw new Error('CEP inválido')
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
      const data = await response.json()

      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: cleanZipCode,
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao buscar CEP')
    },
  })
}
