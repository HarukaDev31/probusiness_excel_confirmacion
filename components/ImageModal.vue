<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
    @click="closeModal"
  >
    <div class="relative max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        size="sm"
        aria-label="Cerrar modal"
        class="absolute top-4 right-4 z-10 bg-white rounded-full shadow-lg"
        @click="closeModal"
      />

      <div class="relative overflow-hidden rounded-lg">
        <img
          :src="imageUrl"
          :alt="altText"
          width="800"
          height="600"
          class="max-w-full max-h-[80vh] min-h-[50vh] object-contain select-none"
          draggable="false"
          :style="{
            transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: isDragging ? 'grabbing' : 'grab'
          }"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
          @wheel="handleWheel"
          @dragstart.prevent
          @selectstart.prevent
        >
      </div>

      <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2"
      >
        <UButton
          icon="i-heroicons-minus"
          variant="ghost"
          size="sm"
          aria-label="Alejar imagen"
          :disabled="imageScale <= 0.5"
          @click="zoomOut"
        />
        <span class="text-sm font-medium min-w-[60px] text-center">
          {{ Math.round(imageScale * 100) }}%
        </span>
        <UButton
          icon="i-heroicons-plus"
          variant="ghost"
          size="sm"
          aria-label="Acercar imagen"
          :disabled="imageScale >= 3"
          @click="zoomIn"
        />
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="sm"
          aria-label="Restablecer zoom"
          @click="resetImage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isOpen: boolean
    imageUrl: string
    altText?: string
  }>(),
  {
    altText: 'Vista previa de imagen'
  }
)

const emit = defineEmits<{
  close: []
}>()

const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

const closeModal = () => {
  emit('close')
}

const resetImage = () => {
  imageScale.value = 1
  imagePosition.value = { x: 0, y: 0 }
  isDragging.value = false
}

const zoomIn = () => {
  if (imageScale.value < 3) {
    imageScale.value = Math.min(3, imageScale.value + 0.25)
  }
}

const zoomOut = () => {
  if (imageScale.value > 0.5) {
    imageScale.value = Math.max(0.5, imageScale.value - 0.25)
  }
}

const handleMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { ...imagePosition.value }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  event.preventDefault()
  event.stopPropagation()

  imagePosition.value = {
    x: dragOffset.value.x + (event.clientX - dragStart.value.x),
    y: dragOffset.value.y + (event.clientY - dragStart.value.y)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  event.stopPropagation()

  if (event.deltaY < 0) zoomIn()
  else zoomOut()
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) resetImage()
  }
)
</script>
