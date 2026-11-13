<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { timelineApi, type TimelineAttachment, type TimelineComment, type TimelineType } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { formatDatesInText } from '../utils/formatDatesInText'

const props = defineProps<{
    tenantId: string
    type: TimelineType
    subjectId: string
    canWrite?: boolean
    originFilter?: TimelineType
}>()

const comments = ref<TimelineComment[]>([])
const content = ref('')
const files = ref<File[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const page = ref(1)
const lastPage = ref(1)
const editingId = ref<string | null>(null)
const editingContent = ref('')
const picker = ref<HTMLInputElement | null>(null)
const totalFiles = computed(() => files.value.length)
let sequence = 0

async function load(next = 1) {
    const current = ++sequence
    loading.value = true
    error.value = ''
    try {
        const result = await timelineApi.list(props.tenantId, props.type, props.subjectId, next, props.originFilter)
        if (current !== sequence) return
        comments.value = next === 1 ? result.data : [...comments.value, ...result.data]
        page.value = result.current_page
        lastPage.value = result.last_page
    } catch (exception) {
        if (current === sequence) error.value = errorMessage(exception)
    } finally {
        if (current === sequence) loading.value = false
    }
}

watch(() => [props.tenantId, props.type, props.subjectId, props.originFilter] as const, () => {
    comments.value = []
    content.value = ''
    files.value = []
    void load()
}, { immediate: true })

function chooseFiles(event: Event) {
    const input = event.target as HTMLInputElement
    const next = Array.from(input.files ?? [])
    if (next.length + files.value.length > 5 || next.some(file => file.size > 10 * 1024 * 1024)) {
        toast.error('Selecione até 5 arquivos de no máximo 10 MB cada.')
        input.value = ''
        return
    }
    files.value = [...files.value, ...next]
    input.value = ''
}

async function publish() {
    if (!content.value.trim() || saving.value) return
    saving.value = true
    try {
        const created = await timelineApi.create(props.tenantId, props.type, props.subjectId, content.value.trim())
        let failed = 0
        for (const file of files.value) {
            try {
                await timelineApi.upload(props.tenantId, created.data.id, file)
            } catch {
                failed++
            }
        }
        content.value = ''
        files.value = []
        toast.success(failed ? 'Comentário salvo, mas alguns anexos falharam.' : 'Comentário publicado.')
        await load()
    } catch (exception) {
        toast.error(errorMessage(exception))
    } finally {
        saving.value = false
    }
}

function startEdit(comment: TimelineComment) {
    editingId.value = comment.id
    editingContent.value = comment.content
}

async function saveEdit() {
    if (!editingId.value || !editingContent.value.trim()) return
    try {
        await timelineApi.update(props.tenantId, editingId.value, editingContent.value.trim())
        editingId.value = null
        await load()
    } catch (exception) {
        toast.error(errorMessage(exception))
    }
}

async function remove(comment: TimelineComment) {
    if (!window.confirm('Excluir este comentário?')) return
    try {
        await timelineApi.remove(props.tenantId, comment.id)
        await load()
        toast.success('Comentário excluído.')
    } catch (exception) {
        toast.error(errorMessage(exception))
    }
}

async function download(file: TimelineAttachment) {
    try {
        await timelineApi.download(props.tenantId, file)
    } catch (exception) {
        toast.error(errorMessage(exception))
    }
}

function formatted(date: string) {
    return new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
    <section class="space-y-5" aria-label="Histórico de comentários">
        <div v-if="canWrite" class="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <label class="block text-sm font-semibold text-slate-700" for="timeline-content">Nova observação</label>
            <textarea id="timeline-content" v-model="content" class="field min-h-28 w-full" maxlength="10000" placeholder="Registre uma conversa ou observação..." />
            <input ref="picker" type="file" multiple class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" @change="chooseFiles" />
            <div v-if="totalFiles" class="flex flex-wrap gap-2">
                <span v-for="(file, index) in files" :key="index" class="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs">
                    {{ file.name }}
                    <button type="button" class="ml-2 text-rose-600" :aria-label="'Remover ' + file.name" @click="files.splice(index, 1)">×</button>
                </span>
            </div>
            <div class="flex items-center justify-between gap-3">
                <button type="button" class="secondary-button w-auto" :disabled="saving" @click="picker?.click()">📎 Anexar arquivos</button>
                <button type="button" class="primary-button w-auto" :disabled="saving || !content.trim()" @click="publish">
                    {{ saving ? 'Publicando…' : 'Publicar comentário' }}
                </button>
            </div>
        </div>
        <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
        <div v-if="!comments.length && !loading" class="rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm text-slate-500">
            Nenhum comentário registrado.
        </div>
        <div v-for="comment in comments" :key="comment.id" class="flex gap-3 border-b border-stone-100 pb-5">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-700">💬</div>
            <div class="min-w-0 flex-1 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-semibold text-slate-800">{{ comment.author?.user?.name ?? 'Usuário' }}</span>
                    <span class="text-xs text-slate-500">{{ formatted(comment.created_at) }}{{ comment.edited_at ? ' · editado' : '' }}</span>
                </div>
                <div v-if="type === 'client' && comment.origin" class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                        {{ comment.origin.type === 'opportunity' ? 'Oportunidade' : comment.origin.type === 'commercial_order' ? 'Pedido' : 'Cliente' }}
                    </span>
                    <span v-if="comment.origin.type === 'opportunity'" class="font-medium text-slate-600">
                        {{ [comment.origin.code, comment.origin.title].filter(Boolean).join(' · ') || comment.origin.id }}
                    </span>
                    <span v-if="comment.origin.type === 'commercial_order'" class="font-medium text-slate-600">
                        {{ comment.origin.code ? 'Origem: ' + comment.origin.code + ' · ' : '' }}Pedido {{ comment.origin.id.slice(0, 8) }}
                    </span>
                </div>
                <template v-if="editingId === comment.id">
                    <textarea v-model="editingContent" class="field w-full" rows="3" />
                    <div class="flex gap-2">
                        <button type="button" class="primary-button w-auto" @click="saveEdit">Salvar</button>
                        <button type="button" class="secondary-button w-auto" @click="editingId = null">Cancelar</button>
                    </div>
                </template>
                <p v-else class="whitespace-pre-wrap break-words text-sm text-slate-700">{{ formatDatesInText(comment.content) }}</p>
                <div v-if="comment.attachments?.length" class="flex flex-wrap gap-2">
                    <button v-for="file in comment.attachments" :key="file.id" type="button" class="rounded-lg border border-stone-200 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50" @click="download(file)">
                        📎 {{ file.original_name }}
                    </button>
                </div>
                <div v-if="canWrite && comment.can_edit" class="flex gap-3 text-xs">
                    <button type="button" class="font-semibold text-blue-700" @click="startEdit(comment)">Editar</button>
                    <button type="button" class="font-semibold text-rose-700" @click="remove(comment)">Excluir</button>
                </div>
            </div>
        </div>
        <button v-if="page < lastPage" type="button" class="secondary-button w-full" :disabled="loading" @click="load(page + 1)">
            {{ loading ? 'Carregando…' : 'Carregar comentários anteriores' }}
        </button>
    </section>
</template>
