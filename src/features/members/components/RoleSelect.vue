<script setup lang="ts">
import { assignableRoles, type AssignableRole } from '../types'
defineProps<{ id: string; allowedRoles: AssignableRole[] }>()
const model = defineModel<AssignableRole>({ required: true })
</script>
<template>
  <div>
    <label :for="id" class="mb-2 block text-sm font-semibold text-slate-700">Papel na empresa</label
    ><select :id="id" v-model="model" class="field">
      <option
        v-for="role in assignableRoles.filter((item) => allowedRoles.includes(item.value))"
        :key="role.value"
        :value="role.value"
      >
        {{ role.label }}
      </option>
    </select>
    <p class="mt-2 text-xs leading-5 text-slate-500">
      As permissões do cargo são definidas pelo proprietário nesta empresa.
    </p>
  </div>
</template>
