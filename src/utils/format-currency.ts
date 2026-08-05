/**
 * Utilitário para formatação de valores monetários em Real Brasileiro (BRL)
 * Padrão: R$ 1.234,56
 */

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @param options - Opções adicionais de formatação
 * @returns String formatada no padrão R$ 1.234,56
 */
export function formatCurrency(value: number | string, options?: { 
  showSymbol?: boolean 
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {}

  // Converter para número se for string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value

  // Validar se é um número válido
  if (isNaN(numericValue)) {
    return showSymbol ? 'R$ 0,00' : '0,00'
  }

  // Usar Intl.NumberFormat para formatação correta
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits
  })

  return formatter.format(numericValue)
}

/**
 * Formata um valor para exibição compacta (ex: R$ 1,2 mil)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada de forma compacta
 */
export function formatCurrencyCompact(value: number): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    compactDisplay: 'short'
  })

  return formatter.format(value)
}

/**
 * Remove formatação e converte string monetária para número
 * @param value - String formatada (ex: "R$ 1.234,56")
 * @returns Número decimal
 */
export function parseCurrency(value: string): number {
  // Remove R$, espaços e pontos de milhares
  const cleanValue = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  return parseFloat(cleanValue) || 0
}
