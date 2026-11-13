import type { RouteLocationRaw } from 'vue-router'
import type { GlobalSearchItem } from '../api/globalSearchApi'

/** Centralizes navigation to the existing module detail deep links. */
export function globalSearchDestination(tenantId: string, item: GlobalSearchItem): RouteLocationRaw {
  const base = '/empresas/' + encodeURIComponent(tenantId)
  switch (item.type) {
    case 'clients':
      return { path: base + '/clientes', query: { cliente: item.id } }
    case 'opportunities':
      return { path: base + '/oportunidades', query: { oportunidade: item.id } }
    case 'orders':
      return { path: base + '/pedidos', query: { pedido: item.id } }
  }
}
