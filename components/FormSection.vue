<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string
  collapsible?: boolean
  defaultOpen?: boolean
  badge?: string
  badgeColor?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' | 'secondary'
}>(), {
  collapsible: false,
  defaultOpen: true,
  badgeColor: 'neutral'
})

const open = ref(props.defaultOpen)
</script>

<template>
  <section class="rounded-lg border border-gray-200 bg-gray-50/40">
    <UCollapsible v-if="collapsible" v-model:open="open" :unmount-on-hide="false">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-100/70 transition-colors"
      >
        <UIcon v-if="icon" :name="icon" class="size-4 text-primary-600 shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm font-medium text-gray-900">{{ title }}</h3>
            <UBadge v-if="badge" :color="badgeColor" variant="subtle" size="xs">{{ badge }}</UBadge>
          </div>
          <p v-if="description" class="text-xs text-gray-500 mt-0.5">{{ description }}</p>
        </div>
        <UIcon
          name="i-heroicons-chevron-down"
          class="size-4 text-gray-400 transition-transform shrink-0"
          :class="{ 'rotate-180': open }"
        />
      </button>
      <template #content>
        <div class="px-3 pb-3 pt-0">
          <slot />
        </div>
      </template>
    </UCollapsible>

    <template v-else>
      <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-200/70">
        <UIcon v-if="icon" :name="icon" class="size-4 text-primary-600 shrink-0" />
        <h3 class="text-sm font-medium text-gray-900">{{ title }}</h3>
        <UBadge v-if="badge" :color="badgeColor" variant="subtle" size="xs">{{ badge }}</UBadge>
      </div>
      <div class="p-3">
        <slot />
      </div>
    </template>
  </section>
</template>
