<template>
  <div class="flex">
    <div class="mr-10">
      <div class="text-sm">余额: BNX {{ bnxStore.bnxBalance }} / GOLD {{ bnxStore.goldBalance }}</div>
      <div
        class="text-sm text-gray"
      >价格: BNX ${{ bnxStore.bnxPrice }} / GOLD ${{ bnxStore.goldPrice }}</div>
    </div>
    <el-button :loading="bnxStore.updateLoading" size="small" @click="bnxStore.updateBnxAndGold()">刷新</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus'
import { useBnxStore } from "@/store/bnx";

const bnxStore = useBnxStore()
</script>

<style lang="scss">
</style>