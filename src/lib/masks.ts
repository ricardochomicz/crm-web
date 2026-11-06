/** Shared Brazilian input masks. All functions accept raw or already-formatted values. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export function maskCpf(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCnpj(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskDocument(value: string | null | undefined, personType: 'PF' | 'PJ'): string {
  return personType === 'PF' ? maskCpf(value) : maskCnpj(value)
}

export function maskBrazilianPhone(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d ? '(' + d : ''
  const number = d.slice(2)
  const split = number.length > 8 ? 5 : 4
  return '(' + d.slice(0, 2) + ') ' +
    (number.length <= split ? number : number.slice(0, split) + '-' + number.slice(split))
}

/** Retorna apenas dígitos, limitando o tamanho para campos de formulário. */
export function digits(value: string | null | undefined, max = 20): string {
  return onlyDigits(value).slice(0, max)
}

export function maskZipCode(value: string | null | undefined): string {
  const d = digits(value, 8)
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d
}
