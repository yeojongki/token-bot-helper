<template>
  <el-dialog v-model="visible" title="拍卖角色">
    <bnx-gold-price-balance class="mb-10"></bnx-gold-price-balance>

    <div class="flex items-center mb-10">
      <label>BNX:</label>
      <el-input-number v-model="bnxCount"></el-input-number>
    </div>

    <div class="text-center">
      <el-button
        :loading="bnxStore.updateLoading"
        size="small"
        @click="bnxStore.updateBnxAndGold()"
        >确定</el-button
      >
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElButton, ElDialog, ElInputNumber } from 'element-plus'
import { useBnxStore } from '@/store/bnx'
import { useVModel } from '@/hooks/useVModel'
import { ref } from 'vue'
import BnxGoldPriceBalanceVue from './BnxGoldPriceBalance.vue'

const props = defineProps({
  visible: Boolean,
})

const bnxCount = ref(0)

const bnxStore = useBnxStore()

const visible = useVModel(props, 'visible')
</script>

<style lang="scss"></style>
