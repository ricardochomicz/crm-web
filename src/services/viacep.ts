import { digits } from '@/lib/masks'

export type ViaCepAddress = {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

/** Consulta pública sem dependência de componentes Vue. */
export async function lookupViaCep(value: string, signal?: AbortSignal): Promise<ViaCepAddress | null> {
  const cep = digits(value, 8)
  if (cep.length !== 8) throw new Error('Informe os 8 dígitos do CEP.')
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) throw new Error('Consulta de CEP indisponível.')
  const address = (await response.json()) as ViaCepAddress
  return address.erro ? null : address
}
