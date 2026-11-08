<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
type Option = { value: string | number; label: string }
const props = defineProps<{ modelValue: string | number | null; options: Option[]; placeholder?: string; required?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const open = ref(false)
const root=ref<HTMLElement|null>(null)
// Native showModal() dialogs render in the browser top layer. A menu
// teleported to body stays behind their backdrop regardless of z-index.
const portalTarget=ref<HTMLElement | null>(null)
const menuStyle=ref<Record<string,string>>({})
function placeMenu(){
 const r=root.value?.getBoundingClientRect();if(!r)return
 const below=window.innerHeight-r.bottom,above=r.top
 const height=Math.min(224,Math.max(100,(below>=160||below>=above?below:above)-12))
 menuStyle.value={position:'fixed',left:r.left+'px',width:r.width+'px',maxHeight:height+'px',zIndex:'9999',...(below>=160||below>=above?{top:(r.bottom+4)+'px'}:{bottom:(window.innerHeight-r.top+4)+'px'})}
}
function refreshMenu(){if(open.value)placeMenu()}
onMounted(()=>{portalTarget.value=root.value?.closest('dialog')??document.body;window.addEventListener('scroll',refreshMenu,true);window.addEventListener('resize',refreshMenu)})
onUnmounted(()=>{window.removeEventListener('scroll',refreshMenu,true);window.removeEventListener('resize',refreshMenu)})
watch(open,async v=>{if(v){await nextTick();placeMenu()}})
const query = ref('')
const active = ref(0)
const selected = computed(() => props.options.find(o => String(o.value) === String(props.modelValue)))
const filtered = computed(() => props.options.filter(o => o.label.toLocaleLowerCase('pt-BR').includes(query.value.toLocaleLowerCase('pt-BR'))))
watch(query, () => { active.value = 0 })
function choose(option: Option) {
 open.value = false
 query.value = ''
 // Closing a nested native dialog restores focus to the previous input.
 // Blur before notifying the parent so focus restoration cannot reopen the menu.
 (root.value?.querySelector('input') as HTMLInputElement | null)?.blur()
 emit('update:modelValue', option.value)
}
function onKeydown(event: KeyboardEvent) {
 if (event.key === 'Escape') { open.value = false; query.value = ''; return }
 if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
  event.preventDefault(); open.value = true
  active.value = Math.max(0, Math.min(filtered.value.length - 1, active.value + (event.key === 'ArrowDown' ? 1 : -1)))
 }
 if (event.key === 'Enter' && open.value && filtered.value[active.value]) { event.preventDefault(); choose(filtered.value[active.value]!) }
}
function close() { open.value = false; query.value = '' }
function onFocusOut(event: FocusEvent) {
 const next = event.relatedTarget as Node | null
 if (next && (root.value?.contains(next) || (open.value && menuRef.value?.contains(next)))) return
 // Defer so clicking a teleported option can finish selection first.
 setTimeout(() => {
  const focused = document.activeElement
  if (!root.value?.contains(focused) && !menuRef.value?.contains(focused)) close()
 }, 0)
}
const menuRef = ref<HTMLElement | null>(null)
</script>
<template>
 <div ref="root" class="relative" @keydown="onKeydown" @focusout="onFocusOut">
  <input
   :disabled="disabled"
   :value="open ? query : (selected?.label ?? '')"
   :placeholder="placeholder ?? 'Selecione ou pesquise...'"
   :required="required && !selected"
   role="combobox" aria-autocomplete="list" :aria-expanded="open" aria-haspopup="listbox"
   autocomplete="off"
   class="w-full rounded-xl bg-stone-100 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-stone-200/70 focus:bg-white focus:ring-2 focus:ring-orange-400"
   @pointerdown="if (!disabled) { open = true; query = '' }"
   @input="query = ($event.target as HTMLInputElement).value; open = true"
  />
  <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
  <Teleport v-if="portalTarget" :to="portalTarget"><div v-if="open" ref="menuRef" role="listbox" :style="menuStyle" class="overflow-y-auto rounded-xl border border-stone-100 bg-white p-1 shadow-xl">
   <button v-for="(option, i) in filtered" :key="option.value" type="button" role="option" :aria-selected="String(option.value) === String(modelValue)" class="block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-orange-50" :class="i === active ? 'bg-orange-50 text-orange-800' : 'text-slate-700'" @pointerdown.prevent="choose(option)">
    {{ option.label }}
   </button>
   <p v-if="!filtered.length" class="px-3 py-3 text-sm text-slate-500">Nenhum resultado encontrado.</p>
  </div></Teleport>
 </div>
</template>
