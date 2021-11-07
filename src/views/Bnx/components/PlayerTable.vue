<template>
  <a-table
    row-key="tokenId"
    :loading="loading"
    :bordered="true"
    :pagination="false"
    :height="props.height"
    :data-source="dataSource"
    :scroll="{ x: 'max-content', y: 500 }"
    :rowSelection="rowSelection"
  >
    <a-table-column data-index="tokenId" title="Token ID" :width="120">
      <template #default="{ record }">
        <div @click="copyId(record.tokenId)" class="id-column">
          {{ record.tokenId.slice(0, 4) }}...{{ record.tokenId.slice(-4) }}
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="role"
      title="角色"
      :width="80"
      :filters="[
        { text: '战士', value: '战士' },
        { text: '盗贼', value: '盗贼' },
        { text: '法师', value: '法师' },
        { text: '游侠', value: '游侠' },
        { text: '卡特莉娜', value: '卡特莉娜' },
      ]"
      :onFilter="onRoleFilter"
    ></a-table-column>

    <a-table-column
      data-index="level"
      :sorter="(a:any, b:any) => sorter(a, b, 'level')"
      title="等级"
      :width="160"
    >
      <template #default="{ record }">
        <div @click="copyRow(record)">
          <div>lv. {{ record.level }}</div>
          <div v-show="record.level > 1" class="upgrade-cost">
            升级成本:
            {{
              getUpgradeCostBnx(
                1,
                record.level,
                bnxStore.goldPrice,
                bnxStore.bnxPrice,
              )
            }}
            BNX
          </div>
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="isAdvance"
      :sorter="(a:any, b:any) => sorter(a, b, 'isAdvance')"
      title="合格"
      :width="80"
    >
      <template #default="{ record }">
        <div>{{ record.isAdvance ? '✅' : '❌' }}</div>
      </template>
    </a-table-column>

    <a-table-column
      v-if="isWorking"
      data-index="income"
      :sorter="(a:any, b:any) => sorter(a, b, 'income')"
      title="收益"
      :default-sort-order="isWorking ? 'descend' : ''"
    >
      <template #default="{ record }">
        <div class="price-row">
          <div>{{ record.income }}</div>
          <div class="price-usd">≈ ${{ record.incomeUsd }}</div>
        </div>
      </template>
    </a-table-column>

    <a-table-column
      v-if="isWorking"
      data-index="goldDaily"
      title="日收益"
      :sorter="(a:any, b:any) => sorter(a, b, 'goldDaily')"
    >
      <template #default="{ record }">
        <div class="price-row">
          <div>{{ record.goldDaily }}</div>
          <div class="price-usd">≈ ${{ record.goldDailyUsd }}</div>
        </div>
      </template>
    </a-table-column>

    <a-table-column
      v-if="isMarketing"
      data-index="price"
      :sorter="(a:any, b:any) => sorter(a, b, 'price')"
      title="价格"
    >
      <template #default="{ record }">
        <div class="price-row">
          <div>{{ record.price }} {{ record.payType }}</div>
          <div class="price-usd">≈ ${{ record.usdPrice }}</div>
        </div>
      </template>
    </a-table-column>

    <a-table-column
      v-if="isMarketing"
      :sorter="(a:any, b:any) => sorter(a, b, 'paybackCycle')"
      data-index="paybackCycle"
      title="回本"
    >
      <template #default="{ record }">
        <div class="price-row">
          <!-- {{ record.paybackCycle }} 天 -->
          <div v-if="!record.isAdvance">零工:{{ record.paybackCycle }}天</div>
          <div v-else>
            <!-- 高级: {{ record.paybackCycleAdvanceBest }} -->
            <div
              v-if="record.level <= 3"
              :class="{ 'text-red': record.paybackCycleLevel === 3 }"
            >
              3级:{{ record.paybackCycle3 }}天
            </div>
            <div
              v-if="record.level <= 4"
              :class="{ 'text-red': record.paybackCycleLevel === 4 }"
            >
              4级:{{ record.paybackCycle4 }}天
            </div>
            <div
              v-if="record.level <= 5"
              :class="{ 'text-red': record.paybackCycleLevel === 5 }"
            >
              5级:{{ record.paybackCycle5 }}天
            </div>
          </div>
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="total"
      :sorter="(a:any, b:any) => sorter(a, b, 'total')"
      title="总属性"
      :width="90"
    ></a-table-column>

    <a-table-column
      data-index="strength"
      :sorter="(a:any, b:any) => sorter(a, b, 'strength')"
      title="力量"
      :width="80"
    >
      <template #default="{ record }">
        <div
          :class="{
            'advance-main-prop':
              record.isAdvance &&
              (record.roleAddress === WarriorAddress ||
                record.roleAddress === RangerAddress),
          }"
        >
          {{ record.strength }}
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="agility"
      :sorter="(a:any, b:any) => sorter(a, b, 'agility')"
      title="敏捷"
      :width="80"
    >
      <template #default="{ record }">
        <div
          :class="{
            'advance-main-prop':
              record.isAdvance && record.roleAddress === RobberAddress,
          }"
        >
          {{ record.agility }}
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="intelligence"
      :sorter="(a:any, b:any) => sorter(a, b, 'intelligence')"
      title="智力"
      :width="80"
    >
      <template #default="{ record }">
        <div
          :class="{
            'advance-main-prop':
              record.isAdvance && record.roleAddress === MageAddress,
          }"
        >
          {{ record.intelligence }}
        </div>
      </template>
    </a-table-column>

    <a-table-column
      data-index="constitution"
      :sorter="(a:any, b:any) => sorter(a, b, 'constitution')"
      title="体质"
      :width="80"
    ></a-table-column>

    <a-table-column
      data-index="willpower"
      :sorter="(a:any, b:any) => sorter(a, b, 'willpower')"
      title="意志"
      :width="80"
    ></a-table-column>

    <a-table-column
      data-index="spirit"
      :sorter="(a:any, b:any) => sorter(a, b, 'spirit')"
      title="精神"
      :width="80"
    ></a-table-column>

    <a-table-column v-if="isMarketing" data-index="order_id" title="订单 ID">
      <template #default="{ record }">
        <div class="id-column" @click="goOriginOrderPage(record.order_id)">
          {{ record.order_id }}
        </div>
      </template>
    </a-table-column>

    <a-table-column v-if="isMarketing" data-index="seller" title="卖家">
      <template #default="{ record }">
        <div class="id-column" @click="goBscScan(record.seller)">
          {{ record.seller.slice(0, 4) }}...{{ record.seller.slice(-4) }}
        </div>
      </template>
    </a-table-column>
  </a-table>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { useBnxStore } from '@/store/bnx'
import copyText from '@/utils/copyText'
import { contractAddress, getUpgradeCostBnx } from '../common'
import type { Hero, ActionType } from '../common'

const props = defineProps({
  api: {
    type: Function as PropType<() => Promise<any>>,
    required: true,
  },
  onSelectionChange: {
    type: Function as PropType<(selectedRows: any[]) => void>,
  },
  hideLoading: Boolean,
  height: Number,
  isNoWorking: Boolean,
  isWorking: Boolean,
  isMarketing: Boolean,
})

const dataSource = ref([])
const loading = ref(false)

const bnxStore = useBnxStore()
const { WarriorAddress, RangerAddress, MageAddress, RobberAddress } =
  contractAddress

/**
 * 请求列表数据
 */
const getList = async () => {
  try {
    if (!props.hideLoading) {
      loading.value = true
    }

    const list = await props.api()
    dataSource.value = list
  } catch (error) {
    console.error(error)
  } finally {
    if (loading.value) {
      loading.value = false
    }
  }
}

/**
 * 暴露接口
 */
defineExpose({
  refresh() {
    return getList()
  },
})

/**
 * 复制 token ID
 */
function copyId(id: string) {
  copyText(id)
}

/**
 * 复制当前行 JSON 数据
 */
function copyRow(row: Hero) {
  copyText(JSON.stringify(row))
}

/**
 * 跳转 bsc scan 卖家地址
 */
function goBscScan(address: string) {
  window.open(`https://bscscan.com/address/${address}`, '_blank')
}

/**
 * 跳转 bnx 官方英雄详情页面
 */
function goOriginOrderPage(orderId: string) {
  window.open(
    `https://market.binaryx.pro/#/oneoffsale/detail/${orderId}`,
    '_blank',
  )
}

/**
 * 角色过滤
 */
function onRoleFilter(value: string, record: any) {
  return record.role === value
}

/**
 * 排序
 */
function sorter(a: any, b: any, key: string) {
  return a[key] - b[key]
}

const rowSelection: TableProps['rowSelection'] = {
  onChange: (_: string[], selectedRows: any[]) => {
    props.onSelectionChange?.(selectedRows)
  },
}

// 没有 bnx gold 价格的时候先去请求
if (bnxStore.bnxPrice == 0) {
  bnxStore.updateBnxAndGold().then(() => {
    getList()
  })
} else {
  getList()
}
</script>

<style lang="less" scoped>
@import '../style.less';
.advance-main-prop {
  font-size: 20px;
  color: @primary-color;
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
