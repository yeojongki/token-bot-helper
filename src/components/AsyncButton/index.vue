<template>
  <el-button type="primary" v-bind="$attrs" :loading="loading" @click="handleClick">
    <slot></slot>
  </el-button>
</template>
<script setup lang="ts">
import { useSlots } from "vue";
import { useRef } from "@/hooks/useRef";

const props = defineProps<{ api: () => Promise<any> }>()
const [loading, setLoading] = useRef(false)

const handleClick = async () => {
  console.log(1)
  try {
    loading.value = true
    await props.api()
  } catch (error) {

  } finally {
    loading.value = false
  }
}
</script>
