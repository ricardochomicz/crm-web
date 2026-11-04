import { ApiError } from './http'
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldError = Object.values(error.errors).flat()[0]
    if (fieldError) return fieldError
    if (error.status === 404) return 'Este espaço não está disponível para a sua conta.'
    return error.message
  }
  return 'Não foi possível concluir. Tente novamente.'
}
export function currency(value: string | number, code = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(Number(value))
}
export function dateLabel(value: string | null): string {
  return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—'
}
