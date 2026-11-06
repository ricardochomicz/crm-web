<script setup lang="ts">
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { assignableRoles, type AssignableRole } from '../types'
defineProps<{ id: string; allowedRoles: AssignableRole[] }>()
const model = defineModel<AssignableRole>({ required: true })
</script>
<template>
  <div>
    <label :for="id" class="mb-2 block text-sm font-semibold text-slate-700">Papel na empresa</label
    ><SearchSelect :model-value="model" :options="assignableRoles.filter(item=>allowedRoles.includes(item.value))" @update:model-value="model = String($event) as AssignableRole"/>
    <p class="mt-2 text-xs leading-5 text-slate-500">
      As permissões do cargo são definidas pelo proprietário nesta empresa.
    </p>
  </div>
</template>
