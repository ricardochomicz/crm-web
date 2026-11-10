/** Formata telefone brasileiro durante a digitação (fixo ou celular). */
export function maskBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  const ddd = digits.slice(0, 2)
  const local = digits.slice(2)
  if (local.length <= 4) return `(${ddd}) ${local}`
  const prefixLength = local.length > 8 ? 5 : 4
  return `(${ddd}) ${local.slice(0, prefixLength)}-${local.slice(prefixLength)}`
}
