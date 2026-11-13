import { nextTick, ref, useId, watch, type Ref } from 'vue'
import type { GlobalSearchItem } from '../api/globalSearchApi'

/** Keyboard focus stays in the search input; the active result is announced by aria-activedescendant. */
export function useGlobalSearchNavigation(items: Readonly<Ref<GlobalSearchItem[]>>) {
  const active = ref(0)
  const list = ref<HTMLElement | null>(null)
  const listId = useId()

  watch(items, () => { active.value = 0 })

  function optionId(item: GlobalSearchItem) {
    return listId + '-' + item.type + '-' + item.id
  }

  function highlight(item: GlobalSearchItem) {
    const index = items.value.findIndex(result => result.id === item.id && result.type === item.type)
    if (index >= 0) active.value = index
  }

  async function move(direction: number) {
    const length = items.value.length
    if (!length) return
    active.value = (active.value + direction + length) % length
    await nextTick()
    list.value?.querySelectorAll<HTMLElement>('[data-search-result]')[active.value]?.scrollIntoView({ block: 'nearest' })
  }

  function keydown(event: KeyboardEvent, select: (item: GlobalSearchItem) => void) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      void move(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter') {
      const item = items.value[active.value]
      if (item) {
        event.preventDefault()
        select(item)
      }
    }
  }

  return { active, list, listId, optionId, highlight, keydown }
}
