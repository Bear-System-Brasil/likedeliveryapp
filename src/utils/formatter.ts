import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const toDateInputFormat = (dateStr: string) => {
  if (!dateStr) return "";
  const date = dayjs.utc(dateStr);
  return date.isValid() ? date.format("YYYY-MM-DD") : "";
};

/**
 * Remove todos os caracteres não numéricos de um CPF
 * @param cpf - CPF com ou sem formatação
 * @returns CPF apenas com números
 */
export const formatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

/**
 * Remove prefixo +55 e caracteres não numéricos de um telefone
 * @param phone - Telefone com ou sem formatação
 * @returns Telefone apenas com números, sem código do país
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("55") && cleanPhone.length === 13) {
    return cleanPhone.substring(2);
  }
  return cleanPhone;
};

/**
 * Formata um CNPJ aplicando a máscara 00.000.000/0000-00
 * @param value - CNPJ com ou sem formatação
 * @returns CNPJ formatado com máscara
 */
export const formatCnpj = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
};

/**
 * Formata um telefone aplicando a máscara (00) 00000-0000
 * @param value - Telefone com ou sem formatação
 * @returns Telefone formatado com máscara
 */
export const formatPhoneDisplay = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

/**
 * Formata um CEP aplicando a máscara 00000-000
 * @param value - CEP com ou sem formatação
 * @returns CEP formatado com máscara
 */
export const formatCep = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
};

/**
 * Remove todos os caracteres não numéricos
 * @param value - String com caracteres diversos
 * @returns String apenas com números
 */
export const onlyNumbers = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Formata um valor monetário para exibição
 * @param value - Valor numérico
 * @returns String formatada como moeda brasileira (R$ 0,00)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Formata uma data para exibição em português
 * @param date - Data como string ou Date
 * @param format - Formato desejado (padrão: 'DD/MM/YYYY')
 * @returns Data formatada
 */
export const formatDate = (
  date: string | Date,
  format: string = "DD/MM/YYYY",
): string => {
  if (!date) return "";
  return dayjs(date).format(format);
};

/**
 * Valida se um CPF é válido (apenas estrutura, não dígitos verificadores)
 * @param cpf - CPF para validar
 * @returns true se tem 11 dígitos
 */
export const isValidCpf = (cpf: string): boolean => {
  const cleaned = formatCPF(cpf);
  return cleaned.length === 11;
};

/**
 * Valida se um CNPJ é válido (apenas estrutura, não dígitos verificadores)
 * @param cnpj - CNPJ para validar
 * @returns true se tem 14 dígitos
 */
export const isValidCnpj = (cnpj: string): boolean => {
  const cleaned = onlyNumbers(cnpj);
  return cleaned.length === 14;
};

/**
 * Valida se um telefone celular é válido
 * @param phone - Telefone para validar
 * @returns true se tem 11 dígitos (DDD + 9 dígitos)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = formatPhone(phone);
  return cleaned.length === 11;
};

/**
 * Valida se um CEP é válido
 * @param cep - CEP para validar
 * @returns true se tem 8 dígitos
 */
export const isValidCep = (cep: string): boolean => {
  const cleaned = onlyNumbers(cep);
  return cleaned.length === 8;
};

export function formatPhoneRegex(phone: string) {
  return phone.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2 $3-$4");
}
