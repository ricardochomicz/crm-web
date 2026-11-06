<script setup lang="ts">
import PagePagination from '@/components/ui/PagePagination.vue'
import { useListPagination } from '@/composables/useListPagination'
import ListFilters from '@/components/ui/ListFilters.vue'
import { useListFilters } from '@/composables/useListFilters'
import ListTable from '@/components/ui/ListTable.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { toast } from '@/services/toast'
import { ApiError } from '@/lib/http'
import { validateClient } from '../validation'
import { useFormValidation } from '@/composables/useFormValidation'
import FormError from '@/components/ui/FormError.vue'
import { clientsApi, type Client, type ClientInput, type Contact, type ContactInput, type Classification, type Seller } from '../api'
import type { Tenant } from '@/features/tenants/types'
const route=useRoute(), tenantId=computed(()=>String(route.params.tenantId))
const tenant=ref<Tenant>(),rows=ref<Client[]>([]),operators=ref<TenantOperator[]>([]),classes=ref<Classification[]>([]),sellers=ref<Seller[]>([])
const canAssignSeller=ref(false),currentSellerId=ref<string|null>(null)
const loading=ref(true),busy=ref(false),error=ref(''),canManage=ref(false),canCreate=ref(false),canDelete=ref(false),search=ref(''),operatorFilter=ref('')
const showSellerSelect=computed(()=>canAssignSeller.value||tenant.value?.role==='OWNER'||tenant.value?.role==='MANAGER')
const writable=computed(()=>canManage.value&&!!tenant.value?.access?.allows_operational_writes)
const canAdd=computed(()=>canCreate.value&&!!tenant.value?.access?.allows_operational_writes)
const canRemove=computed(()=>canDelete.value&&!!tenant.value?.access?.allows_operational_writes)
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ search, operatorFilter })
const filtered=computed(()=>rows.value.filter(r=>(!applied.value.operatorFilter||String(r.operator_id)===applied.value.operatorFilter)&&(!applied.value.search||[r.company_name,r.document,r.email??''].join(' ').toLocaleLowerCase('pt-BR').includes(applied.value.search.toLocaleLowerCase('pt-BR')))))
const blank=():ClientInput=>({person_type:'PJ',document:'',company_name:'',phone:null,email:null,zip_code:null,address:null,address_number:null,address_complement:null,neighborhood:null,city:null,state:null,operator_id:null,classification_id:null,contract_started_on:null,contract_ends_on:null,is_active:true,seller_membership_id:null,seller_reason:null})
const validationState=useFormValidation<keyof ClientInput>()
const form=ref<ClientInput>(blank()),editing=ref(''),modal=ref(false),selected=ref<Client|null>(null),tab=ref<'data'|'contacts'|'sellers'>('data')
const contactBlank=():ContactInput=>({name:'',position:null,phone:null,email:null,is_primary:false,is_active:true,notes:null})
const contact=ref<ContactInput>(contactBlank()),contactEditing=ref(''),contactModal=ref(false)

const digits=(v:string|null|undefined,max=20)=>(v??'').replace(/\D/g,'').slice(0,max)
function maskDoc(v:string|null|undefined,p:'PF'|'PJ'){
 const d=digits(v,p==='PF'?11:14)
 if(p==='PF')return [d.slice(0,3),d.slice(3,6),d.slice(6,9)].filter(Boolean).join('.')+(d.length>9?'-'+d.slice(9):'')
 return d.slice(0,2)+(d.length>2?'.'+d.slice(2,5):'')+(d.length>5?'.'+d.slice(5,8):'')+(d.length>8?'/'+d.slice(8,12):'')+(d.length>12?'-'+d.slice(12):'')
}
function maskPhone(v:string|null|undefined){
 const d=digits(v,11);if(d.length<=2)return d
 const n=d.slice(2),split=d.length>10?5:4
 return '('+d.slice(0,2)+') '+n.slice(0,split)+(n.length>split?'-'+n.slice(split):'')
}
const documentModel=computed({get:()=>maskDoc(form.value.document,form.value.person_type),set:(v:string)=>form.value.document=digits(v,form.value.person_type==='PF'?11:14)})
const phoneModel=computed({get:()=>maskPhone(form.value.phone),set:(v:string)=>form.value.phone=digits(v,11)})
const contactPhoneModel=computed({get:()=>maskPhone(contact.value.phone),set:(v:string)=>contact.value.phone=digits(v,11)})
const cepModel=computed({get:()=>{const d=digits(form.value.zip_code,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d},set:(v:string)=>form.value.zip_code=digits(v,8)})
const cepBusy=ref(false),cepMessage=ref('')
let cepRequest=0
async function lookupCep(){
 const cep=digits(form.value.zip_code,8)
 if(cep.length!==8){cepMessage.value='Informe os 8 dígitos do CEP.';return}
 const request=++cepRequest;cepBusy.value=true;cepMessage.value=''
 try{
  const response=await fetch('https://viacep.com.br/ws/'+cep+'/json/')
  if(!response.ok)throw new Error('CEP indisponível')
  const data=await response.json() as {erro?:boolean;logradouro?:string;bairro?:string;localidade?:string;uf?:string}
  if(request!==cepRequest||digits(form.value.zip_code,8)!==cep)return
  if(data.erro){cepMessage.value='CEP não encontrado.';return}
  form.value.address=data.logradouro??''
  form.value.neighborhood=data.bairro??''
  form.value.city=data.localidade??''
  form.value.state=data.uf??''
  cepMessage.value='Endereço preenchido pelo ViaCEP. Confira os dados.'
 }catch{if(request===cepRequest)cepMessage.value='Consulta indisponível. Preencha o endereço manualmente.'}
 finally{if(request===cepRequest)cepBusy.value=false}
}
watch(()=>form.value.person_type,()=>{form.value.document=digits(form.value.document,form.value.person_type==='PF'?11:14)})

const classesForOperator=computed(()=>classes.value.filter(c=>Number(c.operator_id)===Number(form.value.operator_id)&&c.is_active))
const activeSeller=(c:Client)=>c.sellers?.find(s=>!s.ended_at)
function start(c?:Client){
 validationState.clear();editing.value=c?.id??'';form.value=c?{person_type:c.person_type,document:c.document,company_name:c.company_name,phone:c.phone,email:c.email,zip_code:c.zip_code,address:c.address,address_number:c.address_number,address_complement:c.address_complement,neighborhood:c.neighborhood,city:c.city,state:c.state,operator_id:c.operator_id,classification_id:c.classification_id,contract_started_on:c.contract_started_on,contract_ends_on:c.contract_ends_on,is_active:c.is_active,seller_membership_id:activeSeller(c)?.tenant_user_id??null,seller_reason:null}:blank();if(!c&&!showSellerSelect.value)form.value.seller_membership_id=currentSellerId.value;cepRequest++;cepMessage.value='';modal.value=true
}
async function load(){
 const id=tenantId.value;loading.value=true;error.value=''
 try{
 const [t,list,op,cl,opts]=await Promise.all([tenantApi.show(id),clientsApi.list(id),operatorsApi.available(),clientsApi.classifications(id),clientsApi.options(id)])
 if(id!==tenantId.value)return
 tenant.value=t.data;rows.value=list.data;canManage.value=list.meta.can_manage;canCreate.value=list.meta.can_create;canDelete.value=list.meta.can_delete;operators.value=op.data.map(o=>({...o,selected:true}));classes.value=cl.data;sellers.value=opts.data.sellers;canAssignSeller.value=opts.data.can_assign_seller;currentSellerId.value=opts.data.current_seller_id
 }catch(e){error.value=e instanceof Error?e.message:'Erro ao carregar clientes.'}finally{if(id===tenantId.value)loading.value=false}
}
async function save(){
 if(busy.value)return
 validationState.clear();const validation=validateClient(form.value)
 if(Object.keys(validation).length){validationState.set(validation);return}
 busy.value=true
 try{const data={...form.value,operator_id:form.value.operator_id||null,classification_id:form.value.classification_id||null,seller_membership_id:showSellerSelect.value?(form.value.seller_membership_id||null):(editing.value?null:currentSellerId.value),contract_started_on:form.value.contract_started_on||null,contract_ends_on:form.value.contract_ends_on||null,document:form.value.document.replace(/\D/g,''),zip_code:form.value.zip_code?.replace(/\D/g,'')||null,phone:form.value.phone?.replace(/\D/g,'')||null}
 const r=await clientsApi.save(tenantId.value,data,editing.value||undefined);modal.value=false;toast.success('Cliente salvo.');await load();if(selected.value?.id===r.data.id)await details(r.data.id)
 }catch(e){if(e instanceof ApiError && Object.keys(e.errors).length){validationState.fromApi(e.errors)}else{toast.error(e instanceof Error?e.message:'Erro ao salvar cliente.')}}finally{busy.value=false}
}
async function removeClient(c:Client){
 if(busy.value || !canRemove.value || !window.confirm(`Excluir o cliente "${c.company_name}"? Ele deixará de aparecer na listagem, mas seus dados permanecerão preservados para possível recuperação.`))return
 busy.value=true
 try{await clientsApi.remove(tenantId.value,c.id);if(selected.value?.id===c.id)selected.value=null;toast.success('Cliente enviado para a lixeira.');await load()}
 catch(e){toast.error(e instanceof Error?e.message:'Erro ao excluir cliente.')}
 finally{busy.value=false}
}
async function details(id:string){try{selected.value=(await clientsApi.show(tenantId.value,id)).data;tab.value='data'}catch(e){toast.error(e instanceof Error?e.message:'Erro ao carregar cliente.')}}
function editContact(c?:Contact){contactEditing.value=c?.id??'';contact.value=c?{name:c.name,position:c.position,phone:c.phone,email:c.email,is_primary:c.is_primary,is_active:c.is_active,notes:c.notes}:contactBlank();contactModal.value=true}
async function saveContact(){if(!selected.value||busy.value)return;busy.value=true;try{await clientsApi.contact(tenantId.value,selected.value.id,{...contact.value,phone:digits(contact.value.phone,11)||null},contactEditing.value||undefined);contactModal.value=false;toast.success('Contato salvo.');await details(selected.value.id)}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar contato.')}finally{busy.value=false}}
watch(tenantId,()=>{selected.value=null;modal.value=false;void load()},{immediate:true})
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)
</script>
<template>
<AppShell :tenant="tenant" title="Clientes" subtitle="Carteira comercial e contatos">
 <header class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p class="eyebrow">COMERCIAL</p><h1 class="mt-3 text-3xl font-semibold">Clientes</h1><p class="mt-2 text-sm text-slate-500">Cadastros, operadora atual, classificação e histórico de vendedores.</p></div><button v-if="canAdd" type="button" class="primary-button w-auto" @click="start()">+ Novo cliente</button></header>
 <AsyncNotice :loading="loading" :error="error" @retry="load"/>
 <template v-if="!loading&&!error">
  <ListFilters :columns="2" :count-label="`${filtered.length} resultado(s) encontrado(s)`" @search="applyFilters" @clear="clearFilters"><input v-model="search" class="field max-w-sm" placeholder="Buscar nome, documento ou e-mail"/><div class="min-w-52"><SearchSelect v-model="operatorFilter" :options="[{value:'',label:'Todas as operadoras'},...operators.map(o=>({value:String(o.id),label:o.name}))]"/></div></ListFilters>
  <section class="overflow-x-auto rounded-2xl border border-stone-200 bg-white"><ListTable min-width="700px"><thead class="bg-stone-50"><tr><th class="p-4">Cliente</th><th class="p-4">Documento</th><th class="p-4">Operadora</th><th class="p-4">Classificação</th><th class="p-4">Vendedor</th><th class="p-4">Ações</th></tr></thead><tbody><tr v-for="c in pageRows" :key="c.id" class="border-t border-stone-100"><td class="p-4 font-semibold">{{c.company_name}}</td><td class="p-4">{{c.document}}</td><td class="p-4">{{c.operator?.name??'—'}}</td><td class="p-4">{{c.classification?.code??'—'}}</td><td class="p-4">{{sellers.find(s=>s.id===activeSeller(c)?.tenant_user_id)?.name??'—'}}</td><td class="p-4"><div class="flex gap-2"><TableActionButton icon="eye" :label="`Ver detalhes de ${c.company_name}`" @click="details(c.id)" /><TableActionButton v-if="writable" icon="edit" :label="`Editar ${c.company_name}`" @click="start(c)" /><TableActionButton v-if="canRemove" icon="trash" tone="danger" :label="`Excluir ${c.company_name}`" :disabled="busy" @click="removeClient(c)" /></div></td></tr></tbody></ListTable><p v-if="!filtered.length" class="p-5 text-sm text-slate-500">Nenhum cliente encontrado.</p><PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage" /></section>
  <section v-if="selected" class="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
   <div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-semibold">{{selected.company_name}}</h2><button class="rounded-lg border px-3 py-2" @click="selected=null">Fechar</button></div>
   <div class="mb-5 flex gap-2"><button v-for="item in [{id:'data',label:'Dados'},{id:'contacts',label:'Pessoas de contato'},{id:'sellers',label:'Histórico de vendedores'}] as const" :key="item.id" class="rounded-lg px-3 py-2 text-sm" :class="tab===item.id?'bg-orange-100 text-orange-900':'bg-stone-100'" @click="tab=item.id">{{item.label}}</button></div>
   <div v-if="tab==='data'" class="space-y-2 text-sm"><p><strong>Operadora:</strong> {{selected.operator?.name??'—'}} · <strong>Classificação:</strong> {{selected.classification?.code??'—'}}</p><p><strong>Contato:</strong> {{selected.phone??'—'}} · {{selected.email??'—'}}</p><p><strong>Endereço:</strong> {{[selected.address,selected.address_number,selected.neighborhood,selected.city,selected.state].filter(Boolean).join(', ')}}</p><p><strong>Contrato:</strong> {{selected.contract_started_on??'—'}} até {{selected.contract_ends_on??'—'}}</p></div>
   <div v-if="tab==='contacts'"><button v-if="writable" class="mb-4 rounded-lg border px-3 py-2" @click="editContact()">+ Pessoa de contato</button><div v-for="c in selected.contacts" :key="c.id" class="flex items-center justify-between border-b py-3 text-sm"><div><strong>{{c.name}}</strong> {{c.is_primary?'· Principal':''}}<p class="text-slate-500">{{[c.position,c.phone,c.email].filter(Boolean).join(' · ')}}</p></div><button v-if="writable" class="rounded-lg border px-3 py-1.5" @click="editContact(c)">Editar</button></div><p v-if="!selected.contacts?.length" class="text-sm text-slate-500">Nenhum contato cadastrado.</p></div>
   <div v-if="tab==='sellers'" class="space-y-2"><p v-for="s in selected.sellers" :key="s.id" class="border-b py-2 text-sm">{{sellers.find(m=>m.id===s.tenant_user_id)?.name??s.membership?.user?.name??s.tenant_user_id}} · {{new Date(s.started_at).toLocaleDateString('pt-BR')}} até {{s.ended_at?new Date(s.ended_at).toLocaleDateString('pt-BR'):'Atual'}} {{s.reason?'· '+s.reason:''}}</p><p v-if="!selected.sellers?.length" class="text-sm text-slate-500">Nenhuma atribuição registrada.</p></div>
  </section>
 </template>
 <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"><form novalidate class="max-h-[94dvh] w-full max-w-6xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6" @submit.prevent="save"><h2 class="text-xl font-semibold">{{editing?'Editar cliente':'Novo cliente'}}</h2>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   <label class="text-sm">Tipo de pessoa<SearchSelect v-model="form.person_type" :options="[{value:'PJ',label:'Pessoa jurídica'},{value:'PF',label:'Pessoa física'}]"/></label>
   <label class="text-sm">CPF/CNPJ<input v-model="documentModel" class="field" :aria-invalid="validationState.invalid('document')" :class="validationState.invalid('document')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('document')" :maxlength="form.person_type==='PF'?14:18" inputmode="numeric"/><FormError :message="validationState.errors.document"/></label>
   <label class="text-sm md:col-span-2 xl:col-span-3">Razão social / nome completo<input v-model="form.company_name" class="field" :aria-invalid="validationState.invalid('company_name')" :class="validationState.invalid('company_name')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('company_name')"/><FormError :message="validationState.errors.company_name"/></label>
   <label class="text-sm">Telefone<input v-model="phoneModel" class="field" :aria-invalid="validationState.invalid('phone')" :class="validationState.invalid('phone')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('phone')" inputmode="tel" maxlength="15"/><FormError :message="validationState.errors.phone"/></label><label class="text-sm">E-mail<input v-model="form.email" type="email" class="field" :aria-invalid="validationState.invalid('email')" :class="validationState.invalid('email')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('email')"/><FormError :message="validationState.errors.email"/></label>
   <label class="text-sm">CEP<div class="flex gap-2"><input v-model="cepModel" class="field min-w-0" :aria-invalid="validationState.invalid('zip_code')" :class="validationState.invalid('zip_code')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('zip_code')" inputmode="numeric" maxlength="9" placeholder="00000-000" @blur="digits(form.zip_code,8).length===8 && lookupCep()" /><button type="button" class="shrink-0 rounded-xl border border-stone-200 px-3 text-xs" :disabled="cepBusy" @click="lookupCep">{{cepBusy?'Buscando...':'Buscar CEP'}}</button></div><span v-if="cepMessage" class="mt-1 block text-xs text-slate-500" role="status">{{cepMessage}}</span><FormError :message="validationState.errors.zip_code"/></label><label class="text-sm">Endereço<input v-model="form.address" class="field"/></label>
   <label class="text-sm">Número<input v-model="form.address_number" class="field"/></label><label class="text-sm">Complemento<input v-model="form.address_complement" class="field"/></label>
   <label class="text-sm">Bairro<input v-model="form.neighborhood" class="field"/></label><label class="text-sm">Cidade<input v-model="form.city" class="field"/></label>
   <label class="text-sm">Estado<input v-model="form.state" maxlength="2" class="field" :aria-invalid="validationState.invalid('state')" :class="validationState.invalid('state')?'ring-2 ring-red-400 bg-red-50':''" @input="validationState.clear('state')"/><FormError :message="validationState.errors.state"/></label>
   <label class="text-sm">Operadora atual<SearchSelect v-model="form.operator_id" :options="[{value:'',label:'Sem operadora'},...operators.map(o=>({value:o.id,label:o.name}))]" @update:model-value="form.classification_id=null"/><FormError :message="validationState.errors.operator_id"/></label>
   <label class="text-sm">Classificação<SearchSelect v-model="form.classification_id" :options="[{value:'',label:'Sem classificação'},...classesForOperator.map(c=>({value:c.id,label:c.code+' · '+c.name}))]"/><FormError :message="validationState.errors.classification_id"/></label>
   <label v-if="showSellerSelect" class="text-sm">Vendedor responsável<SearchSelect v-model="form.seller_membership_id" :options="[{value:'',label:'Sem vendedor'},...sellers.map(s=>({value:s.id,label:s.name}))]"/></label>
  </div>
  <label class="flex gap-2 text-sm"><input v-model="form.is_active" type="checkbox"/>Cliente ativo</label>
  <div class="flex justify-end gap-3"><button type="button" class="rounded-lg border px-4 py-2" @click="modal=false">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">{{busy?'Salvando...':'Salvar cliente'}}</button></div>
 </form></div>
 <div v-if="contactModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-2xl max-h-[94dvh] overflow-y-auto space-y-3 rounded-2xl bg-white p-6" @submit.prevent="saveContact"><h2 class="text-xl font-semibold">Pessoa de contato</h2><label class="block text-sm">Nome<input v-model="contact.name" required class="field"/></label><label class="block text-sm">Cargo<input v-model="contact.position" class="field"/></label><label class="block text-sm">Telefone<input v-model="contactPhoneModel" class="field" inputmode="tel" maxlength="15"/></label><label class="block text-sm">E-mail<input v-model="contact.email" type="email" class="field"/></label><label class="flex gap-2 text-sm"><input v-model="contact.is_primary" type="checkbox"/>Contato principal</label><label class="flex gap-2 text-sm"><input v-model="contact.is_active" type="checkbox"/>Ativo</label><div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="contactModal=false">Cancelar</button><button type="submit" class="primary-button w-auto" :disabled="busy">Salvar</button></div></form></div>
</AppShell>
</template>
