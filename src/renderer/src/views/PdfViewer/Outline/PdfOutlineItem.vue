<template>
  <div>
    <div class="outline-item" :class="{ active: isActive }" @click="handleClick">
      {{ item.title }}
    </div>
    <div v-if="item.items && item.items.length > 0" class="outline-children">
      <pdf-outline-item
        v-for="(child, index) in item.items"
        :key="index"
        :item="child"
        @navigate="$emit('navigate', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['navigate'])

const isActive = computed(() => {
  // You can implement logic to determine if this item is currently active
  return false
})

const handleClick = () => {
  if (props.item.dest) {
    emit('navigate', props.item.dest)
  }
}
</script>

<style scoped>
/* Styles already included in the main component */

.outline-item-content {
  font-size: 13px;
  padding: 4px 0;
  display: flex;
  align-items: center;
}

.outline-item-content:hover {
  background-color: #f5f5f5;
}

.outline-item-icon {
  margin-right: 6px;
  flex-shrink: 0;
}

.outline-item-title {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
