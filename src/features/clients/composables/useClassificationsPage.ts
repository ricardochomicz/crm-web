import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useListPagination } from '@/composables/useListPagination'
import { useListFilters } from '@/composables/useListFilters'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import type { Tenant } from '@/features/tenants/types'
import { toast } from '@/services/toast'
import { clientsApi, type Classification, type ClassificationInput, type RuleInput } from '../api'

export function useClassificationsPage() {
const route=useRoute(),tenantId=computed(()=>String(route.params.tenantId))
const tenant=ref<Tenant>(),operators=ref<TenantOperator[]>([]),rows=ref<Classification[]>([])
const loading=ref(true),error=ref(''),busy=ref(false),canManage=ref(false),filter=ref('')
const writable=computed(()=>canManage.value&&!!tenant.value?.access?.allows_operational_writes)
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filter })
const filtered=computed(()=>rows.value.filter(c=>!applied.value.filter||String(c.operator_id)===applied.value.filter))
const blank=():ClassificationInput=>({operator_id:0,code:'',name:'',description:null,is_active:true,sort_order:0})
const form=ref<ClassificationInput>(blank()),editing=ref<number|null>(null),modal=ref(false)
const months=ref<number | null>(null)
const currentRuleId=ref<string|null>(null)
const rule=ref<RuleInput>({minimum_months:null as unknown as number,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null})
const ruleFor=ref<Classification|null>(null),ruleEditing=ref<string|null>(null)
async function load(){const id=tenantId.value;loading.value=true;error.value='';try{const [t,o,c]=await Promise.all([tenantApi.show(id),operatorsApi.tenantList(id),clientsApi.classifications(id)]);if(id!==tenantId.value)return;tenant.value=t.data;operators.value=o.data.filter(x=>x.selected);rows.value=c.data;canManage.value=c.meta.can_manage}catch(e){error.value=e instanceof Error?e.message:'Erro ao carregar classificações.'}finally{if(id===tenantId.value)loading.value=false}}
function edit(c?:Classification){editing.value=c?.id??null;form.value=c?{operator_id:c.operator_id,code:c.code,name:c.name,description:c.description,is_active:c.is_active,sort_order:c.sort_order}:{...blank(),operator_id:0};months.value=c?.rules.find(r=>r.tenant_id===tenantId.value&&r.is_active)?.minimum_months??c?.rules.find(r=>r.is_active)?.minimum_months??null;currentRuleId.value=c?.rules.find(r=>r.tenant_id===tenantId.value&&r.is_active)?.id??null;modal.value=true}
async function save(){
  if(!form.value.operator_id||!form.value.name.trim()||months.value===null||!Number.isInteger(months.value)||months.value<1){toast.error('Informe operadora, classificação e tempo em meses válido.');return}
  busy.value=true
  try{
    const payload={...form.value,code:form.value.name.trim(),name:form.value.name.trim()}
    const response=await clientsApi.saveClassification(tenantId.value,payload,editing.value??undefined)
    const classificationId=editing.value??response.data.id
    const existing=rows.value.find(c=>c.id===classificationId)
    const ownRule=existing?.rules.find(r=>r.tenant_id===tenantId.value&&r.is_active)
    const globalRule=existing?.rules.find(r=>r.tenant_id===null&&r.is_active)
    if(!ownRule||ownRule.minimum_months!==months.value||(!ownRule&&globalRule?.minimum_months!==months.value)){
      await clientsApi.addRule(tenantId.value,classificationId,{
        minimum_months:months.value,valid_from:ownRule?.valid_from??new Date().toLocaleDateString('en-CA'),
        valid_until:null,is_active:true,notes:null
      },ownRule?.id)
    }
    modal.value=false;toast.success('Classificação e prazo salvos.');await load()
  }catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar classificação e prazo.')}finally{busy.value=false}
}
function addRule(c:Classification){ruleEditing.value=null;ruleFor.value=c;rule.value={minimum_months:null as unknown as number,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null}}
function editRule(c:Classification,r:Classification['rules'][number]){ruleFor.value=c;ruleEditing.value=r.id;rule.value={minimum_months:r.minimum_months,valid_from:r.valid_from,valid_until:r.valid_until,is_active:r.is_active,notes:r.notes}}
async function saveRule(){if(!ruleFor.value)return;if(rule.value.minimum_months===null||rule.value.minimum_months===undefined||rule.value.minimum_months==='' as unknown as number||!Number.isInteger(Number(rule.value.minimum_months))||Number(rule.value.minimum_months)<0){toast.error('Informe um número válido de meses mínimos.');return}busy.value=true;try{await clientsApi.addRule(tenantId.value,ruleFor.value.id,rule.value,ruleEditing.value??undefined);ruleFor.value=null;toast.success('Regra de renovação cadastrada.');await load()}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar regra.')}finally{busy.value=false}}
watch(tenantId,load,{immediate:true})
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)

return { tenant, tenantId, operators, rows, loading, error, busy, canManage, filter, writable, filtered, form, editing, modal, months, currentRuleId, rule, ruleFor, ruleEditing, load, edit, save, addRule, editRule, saveRule, page, total, lastPage, pageRows, changePage, applyFilters, clearFilters }
}
