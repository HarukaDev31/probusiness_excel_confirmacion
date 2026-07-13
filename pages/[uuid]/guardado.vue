<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

const uuid = computed(() => String(route.params.uuid || ''))
const carga = computed(() => String(route.query.carga || ''))
const nombreCliente = computed(() => String(route.query.cliente || ''))
const proveedor = computed(() => String(route.query.proveedor || '').trim())
const mensaje = computed(() => String(route.query.mensaje || '').trim())

const volverAlFormulario = () => {
  navigateTo({
    path: `/${uuid.value}`,
    query: {
      ...(proveedor.value ? { proveedor: proveedor.value } : {})
    }
  })
}

onMounted(() => {
  colorMode.preference = 'light'
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <PageHeader :carga="carga || undefined" :nombre-cliente="nombreCliente || undefined" />

    <main class="max-w-lg mx-auto px-4 py-10 sm:py-16">
      <div
        v-if="!uuid"
        class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500"
      >
        Enlace inválido.
      </div>

      <div
        v-else
        class="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-10 text-center"
      >
        <div class="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-success-50 ring-4 ring-success-100">
          <UIcon name="i-heroicons-check-circle" class="size-9 text-success-600" />
        </div>

        <h1 class="text-xl font-semibold text-gray-900">
          Confirmación guardada
        </h1>

        <p class="mt-2 text-sm text-gray-600 leading-relaxed">
          {{ mensaje || 'Tu información se guardó correctamente. Coordinación ya puede revisar los datos de tu confirmación.' }}
        </p>

        <p v-if="nombreCliente" class="mt-4 text-xs text-gray-500">
          {{ nombreCliente }}<template v-if="carga"> · Carga #{{ carga }}</template>
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <UButton
            color="primary"
            icon="i-heroicons-pencil-square"
            label="Volver a editar"
            class="justify-center"
            @click="volverAlFormulario"
          />
        </div>
      </div>
    </main>
  </div>
</template>
