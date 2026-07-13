<script setup lang="ts">
withDefaults(
  defineProps<{
    productCount?: number
  }>(),
  { productCount: 2 }
)
</script>

<template>
  <div class="space-y-3" aria-busy="true" aria-label="Cargando confirmación">
    <!-- Tabs proveedor -->
    <div class="sticky top-11 z-10 -mx-4 px-4 py-2 bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
      <div class="rounded-lg border border-gray-200 bg-white p-1.5">
        <div class="flex gap-1.5 overflow-hidden">
          <USkeleton
            v-for="n in 3"
            :key="`tab-${n}`"
            class="h-9 rounded-lg"
            :class="n === 1 ? 'flex-[1.4]' : 'flex-1'"
          />
        </div>
      </div>
    </div>

    <!-- Progreso general -->
    <div class="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <USkeleton class="h-3.5 w-28 rounded-md" />
        <USkeleton class="h-3.5 w-16 rounded-md" />
      </div>
      <div class="flex items-center gap-2">
        <USkeleton class="h-2 flex-1 rounded-full" />
        <USkeleton class="h-3.5 w-8 rounded-md shrink-0" />
      </div>
    </div>

    <!-- Productos -->
    <div
      v-for="n in productCount"
      :key="`product-${n}`"
      class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      :class="{ 'opacity-80': n > 1 }"
    >
      <div class="px-3 py-2.5 flex items-center gap-2.5 border-b border-gray-100">
        <USkeleton class="size-8 rounded-lg shrink-0" />
        <USkeleton class="h-4 flex-1 max-w-[58%] rounded-md" />
        <USkeleton class="h-5 w-10 rounded-md shrink-0" />
        <USkeleton class="h-5 w-14 rounded-full shrink-0 hidden sm:block" />
        <USkeleton class="size-4 rounded shrink-0" />
      </div>

      <div v-if="n === 1" class="p-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-stretch">
          <USkeleton class="min-h-44 w-full rounded-xl" />

          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 space-y-1.5">
              <USkeleton class="h-3 w-24 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div v-for="field in 4" :key="`field-${field}`" class="space-y-1.5">
              <USkeleton class="h-3 w-16 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div class="col-span-2 space-y-1.5">
              <USkeleton class="h-3 w-14 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div class="pt-1 border-t border-gray-100">
          <div class="flex items-center gap-2 py-2">
            <USkeleton class="size-4 rounded-md shrink-0" />
            <USkeleton class="h-4 w-32 rounded-md" />
            <USkeleton class="h-5 w-10 rounded-full ms-auto" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
            <div v-for="car in 4" :key="`car-${car}`" class="space-y-1.5">
              <USkeleton class="h-3 w-20 rounded-md" />
              <USkeleton class="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra inferior -->
    <div class="fixed bottom-0 inset-x-0 z-30 safe-bottom pointer-events-none">
      <div class="border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <USkeleton class="hidden sm:block h-3.5 w-20 rounded-md shrink-0" />
          <div class="flex-1 flex gap-2 sm:justify-end">
            <USkeleton class="h-9 flex-1 sm:flex-none sm:w-36 rounded-md" />
            <USkeleton class="h-9 flex-1 sm:flex-none sm:w-[140px] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
