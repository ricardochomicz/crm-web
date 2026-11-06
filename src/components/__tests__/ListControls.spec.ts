import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import ListFilters from '../ui/ListFilters.vue'
import PagePagination from '../ui/PagePagination.vue'
import { useListFilters } from '@/composables/useListFilters'
import { useListPagination } from '@/composables/useListPagination'

describe('list controls', () => {
  it('keeps draft filters separate until search and resets pagination when applied', () => {
    const search = ref('')
    const { applied, apply, clear } = useListFilters({ search })
    const rows = computed(() =>
      ['Ana', 'Bia', 'Caio'].filter((name) => name.includes(applied.value.search)),
    )
    const pagination = useListPagination(rows, 1)
    pagination.changePage(3)
    search.value = ' Bia '
    expect(pagination.pageRows.value).toEqual(['Caio'])
    apply()
    expect(pagination.page.value).toBe(1)
    expect(pagination.pageRows.value).toEqual(['Bia'])
    clear()
    expect(search.value).toBe('')
    expect(pagination.total.value).toBe(3)
    pagination.changePage(99)
    expect(pagination.page.value).toBe(3)
  })

  it('submits search and clears filters through shared controls', async () => {
    const wrapper = mount(ListFilters)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('button[type="button"]').trigger('click')
    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('clear')).toHaveLength(1)
    await wrapper.setProps({ busy: true })
    expect(wrapper.findAll('button').every((button) => button.element.disabled)).toBe(true)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('offers adjacent pages and prevents navigation while loading', async () => {
    const wrapper = mount(PagePagination, { props: { page: 1, lastPage: 8, total: 120 } })
    expect(wrapper.get('[aria-label="Página anterior"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[2]])
    await wrapper.setProps({ busy: true })
    expect(wrapper.findAll('button').every((button) => button.element.disabled)).toBe(true)
  })
})
