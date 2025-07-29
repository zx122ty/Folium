<template>
  <div class="tree-node">
    <div class="node-item" :class="{ 'is-file': node.type === 'file' }" @click="handleClick">
      <el-icon :size="16">
        <Folder v-if="node.type === 'directory'" />
        <Document v-else />
      </el-icon>
      <span>{{ node.name }}</span>
      <el-icon v-if="node.type === 'directory'" :size="12">
        <ArrowRight v-if="!isExpanded" />
        <ArrowDown v-else />
      </el-icon>
    </div>
    <div class="node-children" v-if="isExpanded && node.children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        @file-click="$emit('file-click', $event)"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Folder, Document, ArrowRight, ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'FileTreeNode',
  components: {
    Folder,
    Document,
    ArrowRight,
    ArrowDown
  },
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['file-click'],
  setup(props, { emit }) {
    const isExpanded = ref(false)

    const toggleExpand = () => {
      if (props.node.type === 'directory') {
        isExpanded.value = !isExpanded.value
      }
    }

    const handleClick = () => {
      if (props.node.type === 'file') {
        emit('file-click', props.node.path)
      } else {
        toggleExpand()
      }
    }

    return { isExpanded, toggleExpand, handleClick }
  }
}
</script>

<style scoped>
* {
  font-size: small;
}
.tree-node {
  margin-left: 2px;
}
.node-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  cursor: pointer;
}
.node-item:hover {
  background-color: #f5f5f5;
}
.node-item.is-file {
  color: #666;
}
.node-children {
  margin-left: 16px;
}
</style>
