/** Formatting used by product and promotion forms. */
export const money = (value: unknown): string =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const parseBrl = (value: string): number =>
  Number(value.replace(/[^0-9]/g, '')) / 100

export const formatBrlInput = (value: string): string => money(parseBrl(value))
