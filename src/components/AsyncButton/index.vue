<template>
  <el-button
    type="primary"
    v-bind="$attrs"
    :loading="loading"
    @click="handleClick"
  >
    <slot></slot>
  </el-button>
</template>

<script lang="ts">
export default {
  name: 'async-button',
}
</script>

<script setup lang="ts">
import { ElButton } from 'element-plus'
import { useRef } from '@/hooks/useRef'

const props = defineProps<{ api: () => Promise<any>; onSuccess?: () => any }>()
const [loading, setLoading] = useRef(false)

const handleClick = async () => {
  try {
    setLoading(true)
    await props.api()
    props.onSuccess?.()
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}
</script>
