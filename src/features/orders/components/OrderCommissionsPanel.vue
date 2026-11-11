<script setup lang="ts">
import { toRef } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { commissionRoles } from '../commissions-api'
import { useOrderCommissions } from '../composables/useOrderCommissions'
const props = defineProps<{ tenantId: string; orderId: string; writable: boolean }>()
const {
  result,
  loading,
  error,
  page,
  revision,
  status,
  modalOpen,
  saving,
  optionsLoading,
  formError,
  reason,
  editParticipants,
  participants,
  options,
  roles,
  revisions,
  valid,
  internal,
  memberOptions,
  load,
  openRevision,
  addParticipant,
  setRole,
  save,
} = useOrderCommissions(toRef(props, 'tenantId'), toRef(props, 'orderId'), toRef(props, 'writable'))
const statuses: Record<string, string> = {
  ESTIMATED: 'Estimada',
  ELIGIBLE: 'Elegível após ativação',
  PENDING_RULES: 'Pendente de regras',
}
const sources: Record<string, string> = {
  sale: 'Confirmação da venda',
  correction: 'Correção do pedido',
  manual_review: 'Revisão manual',
}
const money = (value: string | null | undefined) =>
  value == null
    ? 'Não apurado'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = (value: string | null | undefined) =>
  value == null
    ? 'Não definida'
    : `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`
const date = (value: string) => value.slice(0, 10).split('-').reverse().join('/')
function issueLabel(issue: string) {
  const [code, role] = issue.split(':')
  const labels: Record<string, string> = {
    company_rule_missing:
      'Cadastre uma regra de comissão da empresa para a operadora e o tipo de pedido.',
    company_rule_ambiguous:
      'Existe mais de uma regra da empresa aplicável. Revise as regras duplicadas.',
    participants_missing: 'Defina os participantes da comissão.',
    participant_rule_missing: 'Falta regra de comissão vigente na data da venda',
    participant_rule_ambiguous: 'Existe mais de uma regra de comissão aplicável',
    sale_rules_not_captured:
      'As regras deste item não foram registradas na venda. Faça uma revisão.',
    line_requires_individualization: 'Individualize as linhas pelo fluxo de correção do pedido.',
    participant_total_exceeds_net_commission:
      'As comissões dos participantes ultrapassam a comissão líquida da empresa.',
  }
  return `${labels[code ?? ''] ?? 'Pendência de apuração. Revise as regras deste item.'}${role ? ` — ${commissionRoles[role as keyof typeof commissionRoles] ?? role}.` : ''}`
}
</script>

<template>
  <section class="space-y-5" aria-label="Comissões do pedido">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold text-slate-800">Comissões do pedido</h3>
        <p class="mt-1 text-sm text-slate-600">
          Percentuais dos participantes calculados sobre o valor da venda. Elegibilidade não
          representa pagamento realizado.
        </p>
      </div>
      <button
        v-if="writable"
        type="button"
        class="primary-button w-auto"
        :disabled="loading || saving || optionsLoading"
        @click="openRevision"
      >
        Nova revisão
      </button>
    </div>
    <div class="flex flex-wrap gap-4">
      <label class="text-sm font-medium text-slate-700"
        >Histórico de revisões<select
          v-model="revision"
          class="field mt-1 block"
          :disabled="loading"
        >
          <option value="">Revisão atual</option>
          <option v-for="number in revisions" :key="number" :value="number">
            Revisão {{ number }}
          </option>
        </select></label
      >
      <label class="text-sm font-medium text-slate-700"
        >Situação<select v-model="status" class="field mt-1 block" :disabled="loading">
          <option value="">Todas</option>
          <option v-for="(label, value) in statuses" :key="value" :value="value">
            {{ label }}
          </option>
        </select></label
      >
    </div>
    <p v-if="loading" role="status" class="text-sm text-slate-500">Carregando comissões…</p>
    <div v-else-if="error" role="alert" class="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
      {{ error }} <button type="button" class="underline" @click="load">Tentar novamente</button>
    </div>
    <template v-else-if="result">
      <p
        v-if="result.meta.requires_capture"
        class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
      >
        Este pedido ainda não possui apuração.
        {{
          writable
            ? 'Registre uma nova revisão para apurar suas linhas.'
            : 'Solicite a apuração ao responsável pelas comissões.'
        }}
      </p>
      <p v-else-if="!result.data.length" class="text-sm text-slate-500">
        Nenhuma linha encontrada para os filtros selecionados.
      </p>
      <div class="grid gap-3 lg:grid-cols-3">
        <article
          v-for="summary in result.meta.summary"
          :key="summary.status"
          class="rounded-xl border border-stone-200 bg-stone-50 p-4"
        >
          <h4 class="font-semibold text-slate-800">
            {{ statuses[summary.status] ?? summary.status }} · {{ summary.line_count }} linha(s)
          </h4>
          <p v-if="summary.status === 'PENDING_RULES'" class="mt-2 text-sm text-amber-800">
            Valores incompletos. Resolva as pendências abaixo antes de considerar o total.
          </p>
          <dl v-else class="mt-3 space-y-1 text-sm">
            <div class="flex justify-between gap-3">
              <dt>Comissão bruta</dt>
              <dd>{{ money(summary.gross_amount) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Deduções</dt>
              <dd>{{ money(summary.deduction_amount) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Participantes</dt>
              <dd>{{ money(summary.participant_total) }}</dd>
            </div>
            <div class="flex justify-between gap-3 font-semibold">
              <dt>Saldo da empresa</dt>
              <dd>{{ money(summary.company_balance) }}</dd>
            </div>
          </dl>
        </article>
      </div>
      <article
        v-for="row in result.data"
        :key="row.id"
        class="space-y-4 rounded-xl border border-stone-200 p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 class="font-semibold text-slate-800">
              {{ row.line_number || 'Linha sem número' }} — {{ row.description || 'Serviço' }}
            </h4>
            <p class="text-xs text-slate-500">
              Revisão {{ row.revision }} · {{ sources[row.source] ?? row.source }} ·
              {{ date(row.created_at) }} {{ row.is_current ? '· Atual' : '· Histórica' }}
            </p>
          </div>
          <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{{
            statuses[row.status] ?? row.status
          }}</span>
        </div>
        <p v-if="row.reason" class="text-sm text-slate-600">
          <strong>Motivo:</strong> {{ row.reason }}
        </p>
        <ul
          v-if="row.issues.length"
          class="list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          <li v-for="issue in row.issues" :key="issue">{{ issueLabel(issue) }}</li>
        </ul>
        <dl class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt class="text-slate-500">Base da venda</dt>
            <dd>{{ money(row.base_amount) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">
              Comissão da empresa · {{ percent(row.rules.company_percentage) }}
            </dt>
            <dd>{{ money(row.gross_amount) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">
              Dedução sobre comissão · {{ percent(row.rules.deduction_percentage) }}
            </dt>
            <dd>{{ money(row.deduction_amount) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Saldo da empresa</dt>
            <dd class="font-semibold">{{ money(row.company_balance) }}</dd>
          </div>
        </dl>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">
              Comissões dos participantes desta linha
            </caption>
            <thead class="border-b border-stone-200 text-slate-500">
              <tr>
                <th class="p-2">Participante</th>
                <th class="p-2">Papel</th>
                <th class="p-2">Percentual sobre a venda</th>
                <th class="p-2">Comissão</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="participant in row.participants.length
                  ? row.participants
                  : row.rules.participants || []"
                :key="participant.role"
                class="border-b border-stone-100"
              >
                <td class="p-2">{{ participant.name }}</td>
                <td class="p-2">{{ commissionRoles[participant.role] }}</td>
                <td class="p-2">{{ percent(participant.percentage) }}</td>
                <td class="p-2">{{ money(participant.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-slate-500">
          Venda: {{ date(row.sold_on) }} · Referência das regras:
          {{ row.rules.reference_date ? date(row.rules.reference_date) : 'Não registrada' }} ·
          Ativação: {{ row.activated_on ? date(row.activated_on) : 'Pendente' }}
        </p>
      </article>
      <nav
        v-if="result.meta.total"
        class="flex flex-wrap items-center justify-between gap-3 text-sm"
        aria-label="Paginação das comissões"
      >
        <span
          >{{ result.meta.total }} registro(s) · Página {{ result.meta.current_page }} de
          {{ result.meta.last_page }}</span
        >
        <div class="flex gap-2">
          <button
            class="secondary-button w-auto"
            type="button"
            :disabled="page <= 1"
            @click="page--"
          >
            Anterior</button
          ><button
            class="secondary-button w-auto"
            type="button"
            :disabled="page >= result.meta.last_page"
            @click="page++"
          >
            Próxima
          </button>
        </div>
      </nav>
    </template>
    <AppDialog
      :open="modalOpen"
      title="Revisar comissões do pedido"
      size="wide"
      :busy="saving"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <p class="text-sm text-slate-600">
          A revisão reapura todas as linhas com as regras cadastradas, considerando a data da venda
          para as vigências. As revisões anteriores permanecem no histórico.
        </p>
        <p v-if="optionsLoading" role="status" class="text-sm text-slate-500">
          Carregando participantes…
        </p>
        <p v-if="formError" role="alert" class="text-sm text-rose-700">{{ formError }}</p>
        <fieldset :disabled="saving || optionsLoading || !options || !writable" class="space-y-4">
          <AppCheckbox v-model="editParticipants" label="Alterar a composição dos participantes" />
          <div v-if="editParticipants" class="space-y-3">
            <p class="text-xs text-slate-500">
              Mantenha o consultor responsável pela venda. Cada papel pode aparecer uma vez.
            </p>
            <div
              v-for="(participant, index) in participants"
              :key="index"
              class="flex flex-wrap items-end gap-2 rounded-lg border border-stone-200 p-3"
            >
              <label class="text-sm"
                >Papel<select
                  v-model="participant.role"
                  class="field mt-1 block"
                  :disabled="participant.role === 'CONSULTANT' && !!options?.consultant_id"
                  @change="setRole(participant)"
                >
                  <option v-for="role in roles" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </option>
                </select></label
              >
              <label class="min-w-48 flex-1 text-sm"
                >Participante<select
                  v-if="internal(participant.role)"
                  v-model="participant.tenant_user_id"
                  class="field mt-1 block w-full"
                  :disabled="participant.role === 'CONSULTANT' && !!options?.consultant_id"
                  required
                >
                  <option :value="null">Selecione</option>
                  <option
                    v-for="member in memberOptions(participant)"
                    :key="member.id"
                    :value="member.id"
                  >
                    {{ member.name }}
                  </option></select
                ><select
                  v-else
                  v-model="participant.commercial_participant_id"
                  class="field mt-1 block w-full"
                  required
                >
                  <option :value="null">Selecione</option>
                  <option
                    v-for="member in memberOptions(participant)"
                    :key="member.id"
                    :value="member.id"
                  >
                    {{ member.name }}
                  </option>
                </select></label
              >
              <button
                type="button"
                class="secondary-button w-auto"
                :disabled="participant.role === 'CONSULTANT' && !!options?.consultant_id"
                @click="participants.splice(index, 1)"
              >
                Remover
              </button>
            </div>
            <button
              type="button"
              class="secondary-button w-auto"
              :disabled="participants.length >= 5"
              @click="addParticipant"
            >
              Adicionar participante
            </button>
          </div>
          <label class="block text-sm font-semibold text-slate-700"
            >Motivo da revisão<textarea
              v-model="reason"
              class="field mt-2 min-h-24 w-full"
              required
              minlength="10"
              maxlength="1000"
              placeholder="Descreva a correção ou a alteração dos participantes."
            />
          </label>
        </fieldset>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="secondary-button w-auto"
            :disabled="saving"
            @click="modalOpen = false"
          >
            Cancelar</button
          ><button
            type="submit"
            class="primary-button w-auto"
            :disabled="!valid || saving || optionsLoading || !options || !writable"
          >
            {{ saving ? 'Registrando…' : 'Registrar revisão' }}
          </button>
        </div>
      </form>
    </AppDialog>
  </section>
</template>
