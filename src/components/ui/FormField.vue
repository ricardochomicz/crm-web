<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ required: true })
withDefaults(
  defineProps<{ id: string; label: string; type?: string; error?: string; hint?: string }>(),
  { type: 'text' },
)
const visible = ref(false)
const capsLock = ref(false)
</script>
<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <label :for="id" class="text-sm font-semibold text-slate-700">{{ label }}</label
      ><slot name="label-action" />
    </div>
    <div class="relative">
      <input
        v-bind="$attrs"
        :id="id"
        v-model="model"
        :type="type === 'password' && visible ? 'text' : type"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
        class="field"
        :class="{ 'pr-12': type === 'password', 'field-error': error }"
        @keydown="capsLock = $event.getModifierState('CapsLock')"
        @keyup="capsLock = $event.getModifierState('CapsLock')"
        @blur="capsLock = false"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-1 my-1 flex w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <AppIcon name="eye" class="size-5" /><span
          v-if="visible"
          class="absolute h-px w-6 rotate-45 bg-current"
        />
      </button>
    </div>
    <p
      v-if="error || hint"
      :id="`${id}-help`"
      class="text-xs leading-relaxed"
      :class="error ? 'text-red-700' : 'text-slate-500'"
    >
      {{ error || hint }}
    </p>
    <p v-if="type === 'password' && capsLock" class="text-xs text-amber-700" role="status">
      Caps Lock está ativado.
    </p>
  </div>
</template>
