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
</script>
<template><div>Tabelas de comissões</div></template>
