import type { ClientInput } from './api'

export type ClientValidationErrors = Partial<Record<keyof ClientInput, string>>
export const onlyDigits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '')

export function validCpf(value: string): boolean {
  const d = onlyDigits(value)
  if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false
  for (let length = 9; length <= 10; length++) {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i)
    const check = ((sum * 10) % 11) % 10
    if (check !== Number(d[length])) return false
  }
  return true
}
export function validCnpj(value: string): boolean {
  const d = onlyDigits(value)
  if (!/^\d{14}$/.test(d) || /^(\d)\1+$/.test(d)) return false
  for (let length = 12; length <= 13; length++) {
    const weights =
      length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, w, i) => total + Number(d[i]) * w, 0)
    const check = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (check !== Number(d[length])) return false
  }
  return true
}
export function validateClient(data: ClientInput): ClientValidationErrors {
  const errors: ClientValidationErrors = {}
  if (!data.company_name.trim()) errors.company_name = 'Informe a razão social ou nome completo.'
  const doc = onlyDigits(data.document)
  if (data.person_type === 'PF' ? !validCpf(doc) : !validCnpj(doc))
    errors.document =
      data.person_type === 'PF' ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.'
  const phone = onlyDigits(data.phone)
  if (phone && !/^[1-9]\d{9,10}$/.test(phone))
    errors.phone = 'Informe um telefone com DDD e 10 ou 11 dígitos.'
  const cep = onlyDigits(data.zip_code)
  if (cep && !/^\d{8}$/.test(cep)) errors.zip_code = 'Informe um CEP com 8 dígitos.'
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Informe um e-mail válido.'
  if (data.state && !/^[A-Za-z]{2}$/.test(data.state))
    errors.state = 'Informe a sigla do estado com 2 letras.'
  if (data.classification_id && !data.operator_id)
    errors.classification_id = 'Selecione a operadora antes da classificação.'
  return errors
}
