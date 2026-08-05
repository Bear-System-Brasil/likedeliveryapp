import { useAuthStore, useCartStore } from '@/stores'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateOrder } from './use-orders'

interface DeliveryInfo {
  addressId?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  phone: string
  name: string
}

interface PaymentInfo {
  method: 'credit' | 'debit' | 'pix' | 'cash'
  cardNumber?: string
  cardName?: string
  cardExpiry?: string
  cardCvv?: string
  changeFor?: string
}

/**
 * Hook para gerenciar o formulário e fluxo de checkout
 */
export const useCheckoutForm = () => {
  const router = useRouter()
  const { items, clearCart, getTotalPrice } = useCartStore()
  const { user } = useAuthStore()
  const createOrder = useCreateOrder()

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: user?.phone || '',
    name: user?.name || '',
  })

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'credit',
  })

  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Atualiza informações de entrega
   */
  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }))
  }

  /**
   * Atualiza informações de pagamento
   */
  const updatePaymentInfo = (field: keyof PaymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }))
  }

  /**
   * Carrega um endereço selecionado
   */
  const loadAddress = (address: any) => {
    setDeliveryInfo({
      addressId: address.id,
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      phone: deliveryInfo.phone,
      name: deliveryInfo.name,
    })
  }

  /**
   * Valida os dados do formulário
   */
  const validateForm = (): boolean => {
    if (!deliveryInfo.street || !deliveryInfo.number || !deliveryInfo.neighborhood) {
      toast.error('Preencha todos os campos obrigatórios do endereço')
      return false
    }

    if (!deliveryInfo.phone) {
      toast.error('Informe um telefone para contato')
      return false
    }

    if (paymentInfo.method === 'credit' || paymentInfo.method === 'debit') {
      if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.cardExpiry || !paymentInfo.cardCvv) {
        toast.error('Preencha todas as informações do cartão')
        return false
      }
    }

    if (paymentInfo.method === 'cash' && !paymentInfo.changeFor) {
      toast.error('Informe o valor para troco')
      return false
    }

    return true
  }

  /**
   * Processa o pedido
   */
  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        customerId: user?.id,
        companyId: items[0].restaurantId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations,
        })),
        deliveryAddress: {
          ...deliveryInfo,
        },
        paymentMethod: paymentInfo.method,
        paymentDetails: paymentInfo.method !== 'pix' && paymentInfo.method !== 'cash' ? {
          cardNumber: paymentInfo.cardNumber?.slice(-4), // Apenas últimos 4 dígitos
          cardName: paymentInfo.cardName,
        } : undefined,
        specialInstructions,
        totalAmount: getTotalPrice(),
      }

      await createOrder.mutateAsync(orderData)

      // Limpa o carrinho
      clearCart()

      // Navega para página de sucesso
      toast.success('Pedido realizado com sucesso!')
      router.push('/order-status')
    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      toast.error('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    deliveryInfo,
    paymentInfo,
    specialInstructions,
    isProcessing,
    updateDeliveryInfo,
    updatePaymentInfo,
    setSpecialInstructions,
    loadAddress,
    handleSubmitOrder,
    totalAmount: getTotalPrice(),
    items,
  }
}
