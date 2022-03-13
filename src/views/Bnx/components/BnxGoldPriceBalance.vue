<template>
  <div class="flex items-center">
    <div class="mr-10">
      <div class="text-sm">
        余额: BNX {{ bnxStore.bnxBalance }} / GOLD {{ bnxStore.goldBalance }}
      </div>
      <div class="text-sm text-gray">
        价格: BNX ${{ bnxStore.bnxPrice }} / GOLD ${{ bnxStore.goldPrice }}
      </div>
    </div>
    <a-button
      :loading="bnxStore.updateLoading"
      size="small"
      type="primary"
      @click="bnxStore.updateBnxAndGold()"
      >刷新</a-button
    >
  </div>
</template>

<script setup lang="ts">
import { useBnxStore } from '@/store/bnx'

const bnxStore = useBnxStore()
</script>

<script lang="ts">
export default {
  name: 'bnx-gold-price-balance',
}
</script>

<style lang="scss"></style>
