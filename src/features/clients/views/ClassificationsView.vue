<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import {useRoute} from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import {tenantApi} from '@/features/tenants/api'
import {operatorsApi,type TenantOperator} from '@/features/operators/api'
import type {Tenant} from '@/features/tenants/types'
import {toast} from '@/services/toast'
import {clientsApi,type Classification,type ClassificationInput,type RuleInput} from '../api'
const route=useRoute(),tenantId=computed(()=>String(route.params.tenantId))
const tenant=ref<Tenant>(),operators=ref<TenantOperator[]>([]),rows=ref<Classification[]>([])
const loading=ref(true),error=ref(''),busy=ref(false),canManage=ref(false),filter=ref('')
const writable=computed(()=>canManage.value&&!!tenant.value?.access?.allows_operational_writes)
const filtered=computed(()=>rows.value.filter(c=>!filter.value||String(c.operator_id)===filter.value))
const blank=():ClassificationInput=>({operator_id:0,code:'',name:'',description:null,is_active:true,sort_order:0})
const form=ref<ClassificationInput>(blank()),editing=ref<number|null>(null),modal=ref(false)
const rule=ref<RuleInput>({minimum_months:18,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null})
const ruleFor=ref<Classification|null>(null),ruleEditing=ref<string|null>(null)
async function load(){const id=tenantId.value;loading.value=true;error.value='';try{const [t,o,c]=await Promise.all([tenantApi.show(id),operatorsApi.tenantList(id),clientsApi.classifications(id)]);if(id!==tenantId.value)return;tenant.value=t.data;operators.value=o.data.filter(x=>x.selected);rows.value=c.data;canManage.value=c.meta.can_manage}catch(e){error.value=e instanceof Error?e.message:'Erro ao carregar classificações.'}finally{if(id===tenantId.value)loading.value=false}}
function edit(c?:Classification){editing.value=c?.id??null;form.value=c?{operator_id:c.operator_id,code:c.code,name:c.name,description:c.description,is_active:c.is_active,sort_order:c.sort_order}:{...blank(),operator_id:operators.value[0]?.id??0};modal.value=true}
async function save(){busy.value=true;try{await clientsApi.saveClassification(tenantId.value,form.value,editing.value??undefined);modal.value=false;toast.success('Classificação salva.');await load()}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar.')}finally{busy.value=false}}
function addRule(c:Classification){ruleEditing.value=null;ruleFor.value=c;rule.value={minimum_months:18,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null}}
function editRule(c:Classification,r:Classification['rules'][number]){ruleFor.value=c;ruleEditing.value=r.id;rule.value={minimum_months:r.minimum_months,valid_from:r.valid_from,valid_until:r.valid_until,is_active:r.is_active,notes:r.notes}}
async function saveRule(){if(!ruleFor.value)return;busy.value=true;try{await clientsApi.addRule(tenantId.value,ruleFor.value.id,rule.value,ruleEditing.value??undefined);ruleFor.value=null;toast.success('Regra de renovação cadastrada.');await load()}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar regra.')}finally{busy.value=false}}
watch(tenantId,load,{immediate:true})
</script>
<template>
<AppShell :tenant="tenant" title="Classificações das operadoras" subtitle="Prazos de renovação por vigência">
<header class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p class="eyebrow">GERENCIAL</p><h1 class="mt-3 text-3xl font-semibold">Classificações das operadoras</h1><p class="mt-2 text-sm text-slate-500">Classificações globais são somente leitura. O proprietário pode criar classificações e regras próprias.</p></div><button v-if="writable" class="primary-button w-auto" @click="edit()">+ Classificação</button></header>
<AsyncNotice :loading="loading" :error="error" @retry="load"/>
<template v-if="!loading&&!error">
<div class="mb-4 max-w-xs"><SearchSelect v-model="filter" :options="[{value:'',label:'Todas as operadoras'},...operators.map(o=>({value:String(o.id),label:o.name}))]"/></div>
<section class="overflow-x-auto rounded-2xl border border-stone-200 bg-white"><table class="w-full min-w-[650px] text-left text-sm"><thead class="bg-stone-50"><tr><th class="p-4">Operadora</th><th class="p-4">Código</th><th class="p-4">Nome</th><th class="p-4">Origem</th><th class="p-4">Regras de renovação</th><th class="p-4">Ações</th></tr></thead><tbody><tr v-for="c in filtered" :key="c.id" class="border-t"><td class="p-4">{{c.operator?.name}}</td><td class="p-4 font-semibold">{{c.code}}</td><td class="p-4">{{c.name}}</td><td class="p-4">{{c.tenant_id?'Empresa':'Global'}}</td><td class="p-4"><p v-for="r in c.rules" :key="r.id" class="text-xs">{{r.minimum_months}} meses · {{r.valid_from}} — {{r.valid_until??'indeterminado'}} {{r.tenant_id?'(empresa)':'(global)'}} <button v-if="writable && (r.tenant_id===tenantId)" type="button" class="underline" @click="editRule(c,r)">Editar</button></p><span v-if="!c.rules.length">—</span></td><td class="p-4"><div class="flex gap-2"><button v-if="writable&&c.tenant_id" class="rounded-lg border px-3 py-1.5" @click="edit(c)">Editar</button><button v-if="writable" class="rounded-lg border px-3 py-1.5" @click="addRule(c)">Nova regra</button></div></td></tr></tbody></table><p v-if="!filtered.length" class="p-5 text-sm text-slate-500">Nenhuma classificação encontrada.</p></section>
</template>
<div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" @submit.prevent="save"><h2 class="text-xl font-semibold">Classificação</h2><label class="block text-sm">Operadora<SearchSelect v-model="form.operator_id" :options="operators.map(o=>({value:o.id,label:o.name}))"/></label><label class="block text-sm">Código<input v-model="form.code" required class="field"/></label><label class="block text-sm">Nome<input v-model="form.name" required class="field"/></label><label class="block text-sm">Descrição<input v-model="form.description" class="field"/></label><label class="flex gap-2 text-sm"><input v-model="form.is_active" type="checkbox"/>Ativa</label><div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="modal=false">Cancelar</button><button class="primary-button w-auto" :disabled="busy">Salvar</button></div></form></div>
<div v-if="ruleFor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" @submit.prevent="saveRule"><h2 class="text-xl font-semibold">Regra de renovação · {{ruleFor.code}}</h2><label class="block text-sm">Meses mínimos<input v-model.number="rule.minimum_months" type="number" min="0" required class="field"/></label><label class="block text-sm">Início da vigência<input v-model="rule.valid_from" type="date" required class="field"/></label><label class="block text-sm">Fim da vigência<input v-model="rule.valid_until" type="date" class="field"/></label><label class="block text-sm">Observações<input v-model="rule.notes" class="field"/></label><div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="ruleFor=null">Cancelar</button><button class="primary-button w-auto" :disabled="busy">Salvar regra</button></div></form></div>
</AppShell>
</template>
