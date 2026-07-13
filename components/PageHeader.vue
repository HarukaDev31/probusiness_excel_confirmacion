<script setup lang="ts">
defineProps<{
  carga?: string
  nombreCliente?: string
  loading?: boolean
}>()
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 h-11 flex items-center gap-3">
      <img
        src="https://intranet.probusiness.pe/assets/img/logos/probusiness.png"
        alt="ProBusiness"
        class="h-5 object-contain shrink-0"
      >
      <div class="h-3.5 w-px bg-gray-200 shrink-0" />
      <div class="min-w-0 flex-1 flex items-baseline gap-2 truncate">
        <span class="text-sm font-semibold text-gray-900 shrink-0">Confirmación</span>
        <USkeleton v-if="loading" class="h-3.5 w-40 max-w-[55%] rounded-md" />
        <span v-else-if="carga" class="text-xs text-gray-500 truncate">
          #{{ carga }}<template v-if="nombreCliente"> · {{ nombreCliente }}</template>
        </span>
      </div>
    </div>
  </header>
</template>
