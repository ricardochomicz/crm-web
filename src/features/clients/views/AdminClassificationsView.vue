<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import PagePagination from '@/components/ui/PagePagination.vue'
import { useListPagination } from '@/composables/useListPagination'
import TableActionButton from '@/components/ui/TableActionButton.vue'
import ListFilters from '@/components/ui/ListFilters.vue'
import { useListFilters } from '@/composables/useListFilters'
import ListTable from '@/components/ui/ListTable.vue'
import {computed,ref,onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {clientsApi,type Classification,type ClassificationInput,type RuleInput} from '../api'
import {request} from '@/lib/http'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import {toast} from '@/services/toast'
const router=useRouter(),rows=ref<Classification[]>([]),operators=ref<{id:number;name:string}[]>([]),loading=ref(true),busy=ref(false),error=ref('')
const form=ref<ClassificationInput>({operator_id:0,code:'',name:'',description:null,is_active:true,sort_order:0})
const editing=ref<number|null>(null),modal=ref(false),ruleFor=ref<Classification|null>(null)
const rule=ref<RuleInput>({minimum_months:18,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null})
const ruleEditing = ref<string | null>(null)
const filter=ref('')
const { applied, apply: applyFilters, clear: clearFilters } = useListFilters({ filter })
const filtered=computed(()=>rows.value.filter(c=>!applied.value.filter||String(c.operator_id)===applied.value.filter))
async function load(){loading.value=true;error.value='';try{const [r,o]=await Promise.all([clientsApi.globalClassifications(),request<{data:{id:number;name:string}[]}>('/api/v1/admin/operators')]);rows.value=r.data;operators.value=o.data}catch(e){error.value=e instanceof Error?e.message:'Erro ao carregar.'}finally{loading.value=false}}
function edit(c?:Classification){editing.value=c?.id??null;form.value=c?{operator_id:c.operator_id,code:c.code,name:c.name,description:c.description,is_active:c.is_active,sort_order:c.sort_order}:{operator_id:operators.value[0]?.id??0,code:'',name:'',description:null,is_active:true,sort_order:0};modal.value=true}
async function save(){busy.value=true;try{await clientsApi.saveGlobalClassification(form.value,editing.value??undefined);modal.value=false;toast.success('Classificação global salva.');await load()}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar.')}finally{busy.value=false}}
function addRule(c:Classification){ruleEditing.value=null;ruleFor.value=c;rule.value={minimum_months:18,valid_from:new Date().toISOString().slice(0,10),valid_until:null,is_active:true,notes:null}}
function editRule(c:Classification,r:Classification['rules'][number]){ruleFor.value=c;ruleEditing.value=r.id;rule.value={minimum_months:r.minimum_months,valid_from:r.valid_from,valid_until:r.valid_until,is_active:r.is_active,notes:r.notes}}
async function saveRule(){if(!ruleFor.value)return;busy.value=true;try{await clientsApi.addGlobalRule(ruleFor.value.id,rule.value,ruleEditing.value??undefined);ruleFor.value=null;toast.success('Regra global salva.');await load()}catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar regra.')}finally{busy.value=false}}
onMounted(load)
const { page, total, lastPage, pageRows, changePage } = useListPagination(filtered)
</script>
<template>
<AppShell title="Classificações globais" subtitle="Administração da plataforma"><div class="space-y-5"><header class="flex items-center justify-between gap-3"><div><p class="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p><h1 class="mt-2 text-3xl font-semibold">Classificações globais</h1><p class="text-sm text-slate-500">Catálogo padrão e vigências das regras de renovação.</p></div><div class="flex gap-2"><button class="rounded-lg border px-3 py-2" @click="router.push('/admin')">Voltar</button><button class="primary-button w-auto" @click="edit()">+ Nova classificação</button></div></header>
<p v-if="loading">Carregando...</p><p v-if="error" class="text-red-600">{{error}}</p>
<template v-if="!loading&&!error"><ListFilters :columns="1" :count-label="`${filtered.length} resultado(s) encontrado(s)`" @search="applyFilters" @clear="clearFilters"><label class="text-sm">Operadora<SearchSelect v-model="filter" :options="[{value:'',label:'Todas as operadoras'},...operators.map(o=>({value:String(o.id),label:o.name}))]"/></label></ListFilters>
<div class="overflow-x-auto rounded-2xl border bg-white"><ListTable min-width="650px"><thead class="bg-stone-50"><tr><th class="p-4">Operadora</th><th class="p-4">Código</th><th class="p-4">Classificação</th><th class="p-4">Regras</th><th class="p-4">Ações</th></tr></thead><tbody><tr v-for="c in pageRows" :key="c.id" class="border-t"><td class="p-4">{{c.operator?.name}}</td><td class="p-4">{{c.code}}</td><td class="p-4">{{c.name}}</td><td class="p-4"><p v-for="r in c.rules" :key="r.id">{{r.minimum_months}} meses · {{r.valid_from}} até {{r.valid_until??'indeterminado'}} <TableActionButton type="button" icon="edit" :label="`Editar regra de ${c.code}`" :busy="busy" @click="editRule(c,r)" /></p></td><td class="p-4"><TableActionButton icon="edit" :label="`Editar ${c.name}`" :busy="busy" @click="edit(c)" /> <TableActionButton icon="tag" :label="`Nova regra para ${c.name}`" :busy="busy" @click="addRule(c)" /></td></tr></tbody></ListTable><PagePagination :page="page" :last-page="lastPage" :total="total" @change="changePage" /></div></template>
<div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" @submit.prevent="save"><h2 class="text-xl font-semibold">Classificação global</h2><label class="block text-sm">Operadora<SearchSelect v-model="form.operator_id" :options="operators.map(o=>({value:o.id,label:o.name}))"/></label><label class="block text-sm">Código<input v-model="form.code" required class="field"/></label><label class="block text-sm">Nome<input v-model="form.name" required class="field"/></label><label class="block text-sm">Descrição<input v-model="form.description" class="field"/></label><label class="flex gap-2 text-sm"><input v-model="form.is_active" type="checkbox"/>Ativa</label><div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="modal=false">Cancelar</button><button class="primary-button w-auto" :disabled="busy">Salvar</button></div></form></div>
<div v-if="ruleFor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" @submit.prevent="saveRule"><h2 class="text-xl font-semibold">Regra global · {{ruleFor.code}}</h2><label class="block text-sm">Meses mínimos<input v-model.number="rule.minimum_months" type="number" min="0" required class="field"/></label><label class="block text-sm">Início<input v-model="rule.valid_from" type="date" required class="field"/></label><label class="block text-sm">Fim<input v-model="rule.valid_until" type="date" class="field"/></label><label class="block text-sm">Observações<input v-model="rule.notes" class="field"/></label><div class="flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="ruleFor=null">Cancelar</button><button class="primary-button w-auto" :disabled="busy">Salvar regra</button></div></form></div>
</div></AppShell>
</template>