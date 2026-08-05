import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

import { Input } from "./input"

interface CurrencyCentsInputProps {
  id?: string
  value?: number
  onValueChange: (value: number | undefined) => void
  placeholder?: string
  className?: string
  maskWhileTyping?: boolean // true = R$ 0,05 ao digitar | false = 0,05 ao digitar
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatCurrencyWithoutSymbol = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Processa entrada monetária com digit shifting e opção de máscara em tempo real
 * maskWhileTyping=false: digita 5 → "0,05" (sem R$)
 * maskWhileTyping=true: digita 5 → "R$ 0,05" (com R$)
 */
const processMonetaryInput = (input: string, maskWhileTyping: boolean = false) => {
  // Extrai apenas dígitos
  let digits = input.replace(/\D/g, "")

  if (!digits) {
    return { displayValue: "", numericValue: undefined }
  }

  // Limitar a 7 dígitos (máximo R$ 99.999,99)
  if (digits.length > 7) {
    digits = digits.substring(0, 7)
  }

  // Sempre força 2 casas decimais usando padding à esquerda
  const padded = digits.padStart(3, "0")
  const integerPart = padded.substring(0, padded.length - 2)
  const decimalPart = padded.substring(padded.length - 2)

  // Remover zeros à esquerda da parte inteira
  const cleanInteger = integerPart.replace(/^0+/, "") || "0"

  // Construir a exibição
  let displayValue = `${cleanInteger},${decimalPart}`

  // Calcular valor numérico
  const numericValue = (parseInt(digits, 10) || 0) / 100

  // Opcionalmente adicionar máscara de moeda ao digitar
  // Verifica se há dígitos sendo digitados (mesmo que 0)
  if (maskWhileTyping && digits.length > 0) {
    displayValue = formatCurrency(numericValue)
  }

  return {
    displayValue,
    numericValue: numericValue > 0 ? numericValue : undefined,
  }
}

export function CurrencyCentsInput({
  id,
  value,
  onValueChange,
  placeholder = "0,01",
  className,
  maskWhileTyping = false,
}: CurrencyCentsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayValue, setDisplayValue] = useState("")
  const isInitializedRef = useRef(false)

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    const char = e.key

    // Bloquear qualquer coisa que não seja dígito ou teclas de controle
    const isDigit = /\d/.test(char)
    const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(char)

    if (!isDigit && !isControlKey) {
      e.preventDefault()
      return
    }

    // Se é um dígito, validar se ultrapassaria o limite de 7 dígitos (máx R$ 99.999,99)
    if (isDigit) {
      const currentDigits = displayValue.replace(/\D/g, "")
      // Máximo 7 dígitos permitidos
      if (currentDigits.length >= 7) {
        e.preventDefault()
      }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value

    // Processa entrada com digit shifting (opcional com máscara)
    const { displayValue: newDisplayValue, numericValue } = processMonetaryInput(rawInput, maskWhileTyping)

    // Atualizar estado para rerender
    setDisplayValue(newDisplayValue)

    // Notificar parent com valor numérico PURO (sem máscara)
    onValueChange(numericValue)
  }

  const handleBlur = () => {
    // Extrair valor numérico para formatação
    const rawValue = displayValue
    const { numericValue } = processMonetaryInput(rawValue, false)

    // Sempre formatar com símbolo de moeda ao sair do campo
    if (numericValue === undefined) {
      setDisplayValue("")
    } else {
      setDisplayValue(formatCurrency(numericValue))
    }
  }

  const handleFocus = () => {
    // Se tem formatação de moeda, remover para edição
    if (displayValue.includes("R$")) {
      const digits = displayValue.replace(/\D/g, "")
      if (digits) {
        const { displayValue: cleanedDisplay } = processMonetaryInput(digits, maskWhileTyping)
        setDisplayValue(cleanedDisplay)
      } else {
        setDisplayValue("")
      }
    }
  }

  // Inicializar com valor da prop se fornecido
  useEffect(() => {
    if (value !== undefined && !isInitializedRef.current) {
      isInitializedRef.current = true
      setDisplayValue(formatCurrency(value))
    }
  }, [])

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      maxLength={maskWhileTyping ? 15 : 11}
      onKeyPress={handleKeyPress}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn(className)}
    />
  )
}
