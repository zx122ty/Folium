<template>
  <svg
    class="svg-icon"
    :class="[{ 'svg-icon-spin': spin }, customClass]"
    :style="getStyle"
    aria-hidden="true"
  >
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 16
  },
  spin: {
    type: Boolean,
    default: false
  },
  customClass: {
    type: String,
    default: ''
  }
})

const getStyle = computed(() => {
  const { color, size } = props
  return {
    color,
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size
  }
})
</script>

<style scoped>
.svg-icon {
  fill: currentColor;
  vertical-align: middle;
  display: inline-block;
}

.svg-icon-spin {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
