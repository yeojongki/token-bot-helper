<template>
  <el-table-column type="selection" width="55" />

  <el-table-column prop="tokenId" label="Token ID" :width="100">
    <template #default="{ row }">
      <div
        @click="copyId(row.tokenId)"
        class="id-column"
      >{{ row.tokenId.slice(0, 4) }}...{{ row.tokenId.slice(-4) }}</div>
    </template>
  </el-table-column>

  <el-table-column v-if="isMarketing" prop="name" label="标题">
    <template #default="{ row }">
      <div :title="row.name">{{ row.name.slice(0, 12) }}{{ row.name.length > 12 ? '...' : '' }}</div>
    </template>
  </el-table-column>

  <el-table-column prop="role" label="角色" width="55"></el-table-column>

  <el-table-column prop="level" sortable label="等级" width="80">
    <template #default="{ row }">
      <div>lv. {{ row.level }}</div>
      <div
        v-show="row.level > 1"
        class="upgrade-cost"
      >升级成本: {{ getUpgradeCostBnx(row.level, bnxStore.goldPrice, bnxStore.bnxPrice) }} BNX</div>
    </template>
  </el-table-column>

  <el-table-column prop="isAdvance" sortable label="合格" width="80">
    <template #default="{ row }">
      <div>{{ row.isAdvance ? '✅' : '❌' }}</div>
    </template>
  </el-table-column>

  <el-table-column v-if="isWorking" prop="income" sortable label="收益">
    <template #default="{ row }">
      <div class="price-row">
        <div>{{ row.income }}</div>
        <div class="price-usd">≈ ${{ row.incomeUsd }}</div>
      </div>
    </template>
  </el-table-column>

  <el-table-column v-if="isMarketing" prop="price" sortable label="价格">
    <template #default="{ row }">
      <div class="price-row">
        <div>{{ row.price }} {{ row.payType }}</div>
        <div class="price-usd">≈ {{ row.usdPrice }}</div>
      </div>
    </template>
  </el-table-column>

  <el-table-column prop="total" sortable label="总属性" width="90"></el-table-column>

  <el-table-column prop="strength" sortable label="力量">
    <template #default="{ row }">
      <div
        :class="{ 'advance-main-prop': row.isAdvance && (row.roleAddress === WarriorAddress || row.roleAddress === RangerAddress) }"
      >{{ row.strength }}</div>
    </template>
  </el-table-column>

  <el-table-column prop="agility" sortable label="敏捷">
    <template #default="{ row }">
      <div
        :class="{ 'advance-main-prop': row.isAdvance && row.roleAddress === RobberAddress }"
      >{{ row.agility }}</div>
    </template>
  </el-table-column>

  <el-table-column prop="intelligence" sortable label="智力">
    <template #default="{ row }">
      <div
        :class="{ 'advance-main-prop': row.isAdvance && row.roleAddress === MageAddress }"
      >{{ row.intelligence }}</div>
    </template>
  </el-table-column>

  <el-table-column prop="constitution" sortable label="体质"></el-table-column>

  <el-table-column prop="willpower" sortable label="意志"></el-table-column>

  <el-table-column prop="spirit" sortable label="精神"></el-table-column>

  <el-table-column v-if="isMarketing" prop="order_id" sortable label="订单id" width="90">
    <template #default="{ row }">
      <div class="id-column" @click="goOriginOrderPage(row.order_id)">{{ row.order_id }}</div>
    </template>
  </el-table-column>

  <el-table-column v-if="isMarketing" prop="seller" label="卖家">
    <template #default="{ row }">
      <div class="id-column" @click="copyId(row.seller)">{{ row.seller.slice(0, 4) }}...{{ row.seller.slice(-4) }}</div>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import copyText from '@/utils/copyText';
import { ElTableColumn } from 'element-plus'
import { contractAddress, getUpgradeCostBnx } from '../common'
import { useBnxStore } from "@/store/bnx";
import { computed } from 'vue-demi';

const props = defineProps({
  isWorking: Boolean,
  isMarketing: Boolean
})

const bnxStore = useBnxStore()
const { WarriorAddress, RangerAddress, MageAddress, RobberAddress } = contractAddress

/**
 * 复制 token ID
 */
function copyId(id: string) {
  copyText(id)
}

function goOriginOrderPage(orderId: string) {
  window.open(`https://www.binaryx.pro/#/oneoffsale/detail/${orderId}`, "_blank")
}
</script>

<style lang="scss" scoped>
@import "../style.scss";
.advance-main-prop {
  font-size: 20px;
  color: var(--el-color-primary);
  font-weight: bold;
}
.price-row {
  font-weight: bold;
  .price-usd {
    display: flex;
    font-size: 10px;
  }
}

.upgrade-cost {
  font-size: 10px;
  color: red;
  line-height: 1.4;
}
</style>