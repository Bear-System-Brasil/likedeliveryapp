/**
 * =============================================================================
 * FINANCIAL PREFERENCES STORE - PREFERÊNCIAS DO MÓDULO FINANCEIRO
 * =============================================================================
 *
 * Preferências locais (owner/admin) para as telas de /financial-management.
 * Não existe endpoint de "configurações financeiras" no backend - isso vive
 * só no navegador de quem opera o caixa, separado do usePreferencesStore
 * (que é do cliente final, não do dono da empresa).
 */

import { PaymentMethod } from '@/services/api'
import { STORAGE_KEYS } from '@/utils/storage-manager'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface FinancialPreferences {
  // Método pré-selecionado nos diálogos de sangria/suprimento/venda/reembolso.
  defaultPaymentMethod: PaymentMethod
  // Exige marcar uma confirmação extra antes de fechar o caixa.
  confirmBeforeCloseRegister: boolean
}

interface FinancialPreferencesState extends FinancialPreferences {
  setDefaultPaymentMethod: (method: PaymentMethod) => void
  setConfirmBeforeCloseRegister: (value: boolean) => void
  resetFinancialPreferences: () => void
}

const defaultFinancialPreferences: FinancialPreferences = {
  defaultPaymentMethod: PaymentMethod.CASH,
  confirmBeforeCloseRegister: true,
}

export const useFinancialPreferencesStore = create<FinancialPreferencesState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultFinancialPreferences,

        setDefaultPaymentMethod: (method) =>
          set(
            { defaultPaymentMethod: method },
            false,
            'financial-preferences/setDefaultPaymentMethod',
          ),

        setConfirmBeforeCloseRegister: (value) =>
          set(
            { confirmBeforeCloseRegister: value },
            false,
            'financial-preferences/setConfirmBeforeCloseRegister',
          ),

        resetFinancialPreferences: () =>
          set(defaultFinancialPreferences, false, 'financial-preferences/reset'),
      }),
      {
        name: STORAGE_KEYS.FINANCIAL_PREFERENCES,
        version: 1,
      },
    ),
    {
      name: 'financial-preferences-store',
      enabled: process.env.NODE_ENV !== 'production',
    },
  ),
)
