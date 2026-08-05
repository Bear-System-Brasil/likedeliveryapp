import { apiService } from '@/services/api'
import { useState } from 'react'
import { toast } from 'sonner'

export interface Address {
  id?: string
  zipCode: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
  complement?: string
  reference?: string
  isDefault?: boolean
}

export interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Hook para buscar informações de endereço pelo CEP usando a API ViaCEP
 * @returns Função para buscar CEP e estados de carregamento/erro
 */
export const useViaCep = () => {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  /**
   * Busca informações de endereço pelo CEP
   * @param cep - CEP com ou sem formatação
   * @returns Dados do endereço ou null em caso de erro
   */
  const fetchAddressByCep = async (cep: string): Promise<ViaCepResponse | null> => {
    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      return null
    }

    setIsLoadingCep(true)
    setCepError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setCepError('CEP não encontrado')
        toast.error('CEP não encontrado')
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      setCepError('Erro ao buscar CEP')
      toast.error('Erro ao buscar CEP. Verifique sua conexão.')
      return null
    } finally {
      setIsLoadingCep(false)
    }
  }

  return {
    fetchAddressByCep,
    isLoadingCep,
    cepError,
  }
}

/**
 * Hook para gerenciar endereços de empresas
 * @returns Métodos e estados para CRUD de endereços
 */
export const useAddressManagement = () => {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)

  /**
   * Carrega todos os endereços da empresa
   */
  const loadAddresses = async () => {
    setIsLoadingAddresses(true)
    try {
      const response = await apiService.address.getCompanyAddresses()
      if (response.success && response.data) {
        setAddresses(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
      toast.error('Erro ao carregar endereços')
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  /**
   * Adiciona um novo endereço
   * @param address - Dados do novo endereço
   * @returns true se adicionado com sucesso
   */
  const addAddress = async (address: Address): Promise<boolean> => {
    setIsAddingAddress(true)
    try {
      const addressData = {
        zipCode: address.zipCode,
        state: address.state,
        city: address.city,
        neighborhood: address.neighborhood,
        street: address.street,
        number: address.number,
        complement: address.complement,
        reference: address.reference,
        isDefault: address.isDefault ?? false,
      }
      const response = await apiService.address.createCompanyAddress(addressData)

      if (response.success && response.data) {
        setAddresses(prev => [...prev, response.data!])
        toast.success('Endereço adicionado com sucesso!')
        return true
      } else {
        toast.error(response.message || 'Erro ao adicionar endereço')
        return false
      }
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error)
      toast.error('Erro ao adicionar endereço')
      return false
    } finally {
      setIsAddingAddress(false)
    }
  }

  /**
   * Remove um endereço
   * @param addressId - ID do endereço a ser removido
   * @returns true se removido com sucesso
   */
  const deleteAddress = async (addressId: string): Promise<boolean> => {
    setIsDeletingAddress(true)
    try {
      const response = await apiService.address.deleteCompanyAddress(addressId)

      if (response.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId))
        toast.success('Endereço removido com sucesso!')
        return true
      } else {
        toast.error(response.message || 'Erro ao remover endereço')
        return false
      }
    } catch (error) {
      console.error('Erro ao remover endereço:', error)
      toast.error('Erro ao remover endereço')
      return false
    } finally {
      setIsDeletingAddress(false)
    }
  }

  return {
    addresses,
    setAddresses,
    isLoadingAddresses,
    isAddingAddress,
    isDeletingAddress,
    loadAddresses,
    addAddress,
    deleteAddress,
  }
}
