<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AsyncNotice from '@/components/ui/AsyncNotice.vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { request, mutate } from '@/lib/http'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
type Commission = { id: string; name: string; operator_id: number; operator?: { name: string }; percentage: string; deduction_percentage: string | null; is_active: boolean }
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const tenant = ref<Tenant>()
const rows = ref<Commission[]>([])
const operators = ref<TenantOperator[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const canManage = ref(false)
const defaultDeduction = ref('0')
const base = computed(() => `/api/v1/tenants/${encodeURIComponent(tenantId.value)}/commissions`)
const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
</script>
<template><div>Tabelas de comissões</div></template>
