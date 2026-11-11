import { ref } from 'vue'

// Session stays in memory only: no localStorage or persistent browser credentials.
export const portalSession = ref<{ tenantId: string; token: string } | null>(null)
