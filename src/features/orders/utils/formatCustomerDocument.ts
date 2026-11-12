/** Formats Brazilian CPF/CNPJ for display without changing the stored value. */
export function formatCustomerDocument(value: string | null | undefined): string {
  const normalized = (value ?? '').replace(/\D/g, '')
  if (normalized.length === 11) return normalized.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  if (normalized.length === 14) return normalized.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  return value || 'Não informado'
}
