<template>
  <el-button type="primary" v-bind="$attrs" :loading="loading" @click="handleClick">
    <slot></slot>
  </el-button>
</template>

<script lang="ts">
export default {
  name: 'async-button'
}
</script>

<script setup lang="ts">
import { useSlots } from "vue";
import { ElButton } from 'element-plus'
import { useRef } from "@/hooks/useRef";

const props = defineProps<{ api: () => Promise<any> }>()
const [loading, setLoading] = useRef(false)

const handleClick = async () => {
  try {
    loading.value = true
    await props.api()
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false
  }
}
</script>
