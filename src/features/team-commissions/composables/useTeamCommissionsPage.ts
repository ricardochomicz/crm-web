import { computed, ref } from 'vue'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { toast } from '@/services/toast'
import { useTeamCommissions } from './useTeamCommissions'

/** Filtros, paginação e exportação segura de regras comerciais. */
export function useTeamCommissionsPage() {
const { tenant, rows, operators, orderTypes, roles, loading, busy, error, writable, editingId, modalOpen, form, label, edit, load, save } = useTeamCommissions()
const filterOperator = ref('')
const filterOrderType = ref('')
const filterRole = ref('')
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filterOperator, filterOrderType, filterRole })
const filteredRows = computed(() => rows.value.filter(row =>
 (!applied.value.filterOperator || String(row.operator_id) === applied.value.filterOperator) &&
 (!applied.value.filterOrderType || row.order_type === applied.value.filterOrderType) &&
 (!applied.value.filterRole || row.commercial_role === applied.value.filterRole)
))
const exportRows = computed(() => filteredRows.value.filter(row => row.is_active))
const exportAllowed = computed(() => applied.value.filterRole !== '' && exportRows.value.length > 0)
const exportTitle = computed(() => 'Tabela de comissionamento — ' + label(roles.value, applied.value.filterRole))
const safe = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const displayDate = (value: string | null) => value ? value.split('-').reverse().join('/') : 'Indeterminado'
const exportData = () => exportRows.value.map(row => [
 row.operator?.name ?? operators.value.find(o => o.id === row.operator_id)?.name ?? '',
 label(orderTypes.value, row.order_type),
 label(roles.value, row.commercial_role),
 Number(row.percentage).toLocaleString('pt-BR', {maximumFractionDigits: 2}) + '%',
 displayDate(row.starts_on),
 displayDate(row.ends_on),
])
function exportCsv() {
 if (!exportAllowed.value) return
 const header = ['Operadora', 'Tipo de pedido', 'Papel comercial', 'Comissão sobre contrato', 'Vigência inicial', 'Vigência final']
 const escapeCsv = (v: string) => {
  const normalized = /^[=+@\-\t\r]/.test(v) ? "'" + v : v
  return '"' + normalized.replace(/"/g, '""') + '"'
 }
 const csv = '\uFEFF' + [header, ...exportData()].map(row => row.map(escapeCsv).join(';')).join('\r\n')
 const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}))
 const link = document.createElement('a')
 link.href = url; link.download = 'comissoes-' + applied.value.filterRole.toLowerCase() + '.csv'
 document.body.appendChild(link); link.click(); link.remove()
 URL.revokeObjectURL(url)
}
function exportPdf() {
 if (!exportAllowed.value) return
 const popup = window.open('', '_blank')
 if (!popup) { toast.error('Permita pop-ups para imprimir ou salvar em PDF.'); return }
 const headers = ['Operadora','Tipo de pedido','Papel','Comissão','Início','Fim']
 const tr = (cells: string[], heading = false) => '<tr>' + cells.map(v => '<' + (heading ? 'th' : 'td') + '>' + safe(v) + '</' + (heading ? 'th' : 'td') + '>').join('') + '</tr>'
 const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + safe(exportTitle.value) + '</title><style>body{font-family:Arial,sans-serif;color:#182333;margin:36px}h1{font-size:22px}p{color:#536071}table{border-collapse:collapse;width:100%;margin-top:24px;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}th{background:#f1f3f5}@page{size:A4 landscape;margin:15mm}</style></head><body><h1>' + safe(exportTitle.value) + '</h1><p>' + safe(tenant.value?.name ?? '') + ' · Percentuais calculados sobre o valor-base do contrato. Regras ativas e vigências conforme tabela.</p><table><thead>' + tr(headers,true) + '</thead><tbody>' + exportData().map(row => tr(row)).join('') + '</tbody></table><p>Documento informativo. Condições sujeitas à vigência e às regras contratuais aplicáveis.</p></body></html>'
 popup.document.open(); popup.document.write(html); popup.document.close()
 popup.focus()
 popup.print()
}
const { page, total, lastPage, pageRows, changePage } = useListPagination(filteredRows)

return { tenant, rows, operators, orderTypes, roles, loading, busy, error, writable, editingId, modalOpen, form, label, edit, load, save,
filterOperator, filterOrderType, filterRole, applyFilters, clearFilters, filteredRows, exportAllowed, exportCsv, exportPdf, page, total, lastPage, pageRows, changePage }
}
