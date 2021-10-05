<template>
  <el-card class="page-bnx">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex">
          <div>市场列表</div>
          <el-switch
            class="ml-10"
            v-model="autoBuy.open"
            :active-text="autoBuy.open ? '已开启自动购买' : '已关闭自动购买'"
          ></el-switch>
        </div>
        <div class="flex items-center">
          <div class="flex items-center mr-10">
            <div class="mr-10">刷新间隔:</div>
            <el-input-number
              @change="handleIntervalChange"
              v-model="getListInterval"
              :step-strictly="true"
              :step="100"
            ></el-input-number>
          </div>
          <el-button
            @click="toggleShouldWatch()"
            :type="watchClosed ? 'success' : 'info'"
          >{{ watchClosed ? '监听中' : '已关闭监听' }}</el-button>
        </div>
      </div>
    </template>
    <!-- <div class="mb-10 flex items-center">
      <el-button :disabled="!selection.length" class="ml-10" type="primary" @click="batchBuy">批量购买</el-button>
    </div>-->

    <div class="mb-20 flex items-center">
      <div class="flex items-center ml-10">
        <div class="mr-10">自动购买最低值:</div>
        <el-input-number v-model="autoBuy.minPrice" :step-strictly="true" :step="0.01"></el-input-number>
      </div>

      <div class="flex items-center ml-10">
        <div class="mr-10">Gas Price:</div>
        <el-input-number v-model="autoBuy.gasPrice" :step-strictly="true" :step="1"></el-input-number>
      </div>

      <div class="flex items-center ml-10">
        <div class="mr-10">Gas Limit:</div>
        <el-input-number v-model="autoBuy.gasLimit" :step-strictly="true" :step="10000"></el-input-number>
      </div>
    </div>

    <el-table
      :default-sort="{ prop: 'price', order: 'ascending' }"
      height="500"
      :data="marketList"
      :border="true"
      @selection-change="selectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="tokenId" label="Token ID" :width="100">
        <template #default="{ row }">
          <div class="id-column">{{ row.tokenId.slice(0, 4) }}...{{ row.tokenId.slice(-4) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="标题"></el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column prop="price" sortable label="价格"></el-table-column>
      <el-table-column prop="level" sortable label="等级" :width="80">
        <template #default="{ row }">
          <div>lv. {{ row.level }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="total" sortable label="总属性"></el-table-column>
      <!-- <el-table-column prop="income" sortable label="收益"></el-table-column> -->
      <!-- <el-table-column prop="income" sortable label="区块数"></el-table-column> -->
      <el-table-column prop="strength" sortable label="力量"></el-table-column>
      <el-table-column prop="agility" sortable label="敏捷"></el-table-column>
      <el-table-column prop="constitution" sortable label="体质"></el-table-column>
      <el-table-column prop="willpower" sortable label="意志"></el-table-column>
      <el-table-column prop="intelligence" sortable label="智力"></el-table-column>
      <el-table-column prop="spirit" sortable label="精神"></el-table-column>
      <el-table-column prop="seller" label="卖家">
        <template #default="{ row }">
          <div class="id-column">{{ row.seller.slice(0, 4) }}...{{ row.seller.slice(-4) }}</div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider';
import { Contract } from '@ethersproject/contracts';
import { ElCard, ElSwitch, ElInputNumber, ElTable, ElTableColumn, ElButton, ElMessage, ElLoading, } from 'element-plus'
import { BigNumber, utils } from 'ethers';
import { reactive, ref } from 'vue';
import type { Ref } from 'vue'
import type { TableColumnCtx } from 'element-plus/lib/components/table/src/table-column/defaults';
import { useRef } from '@/hooks/useRef';
import { contractAddress, getContracts, roleType } from './common';
import type { Hero, WorkingHero } from './common';
import { get } from '@/utils/request';
import { formatEther } from '@ethersproject/units';
import SaleNewABI from './abi/saleNew'
import saleNew from './abi/saleNew';
import { userInfo } from 'os';
import { withPoll } from '@/utils';

const { wallet } = useActiveProvider()
const newSaleAddress = "0x1416e6EA40CBb1F09Cd2dbEdAAd6fbFE3e38D51F"
const saleContractNew = new Contract(newSaleAddress, SaleNewABI, wallet)

const getListInterval = ref(2200)
const [watchClosed, setWatchClosed] = useRef<NodeJS.Timeout>(undefined as any)
const marketList = ref([])


const currentBuying: Record<string, boolean> = {}

/**
 * 自动购买
 */
const autoBuy = reactive({
  /**
   * 是否开启
   */
  open: false,
  /**
   * 购买最低价
   */
  minPrice: 0.43,

  gasLimit: 530000,
  gasPrice: 6,
})

/**
 * 列表选中
 */
const selection = ref<WorkingHero[]>([])

/**
 * 列表勾选事件
 */
function selectionChange(val: WorkingHero[]) {
  selection.value = val
}

/**
 * 获取市场列表
 */
async function getList(page = 1, options?: object) {
  try {
    const params = {
      page: 1,
      page_size: 30,
      status: 'selling',
      name: '',
      sort: 'time',
      career: '',
      ...options,
    }
    const { code, data } = await get(`https://www.binaryx.pro/getSales`, params)
    if (code === 0 && data?.result && data?.result?.items) {
      const items = data.result.items || []
      marketList.value = items.map((item: any) => {
        // 价格
        item.price = Number(utils.formatEther(item.price))

        // 自动购买
        if (autoBuy.open && item.price <= autoBuy.minPrice && !currentBuying[item.order_id]) {
          // 设置已经购买
          currentBuying[item.order_id] = true
          buyPlayer(item.order_id, item.price)
        }

        // id
        item.tokenId = item.token_id
        delete item.token_id

        // 体质
        item.constitution = item.physique
        delete item.physique

        // 意志
        item.willpower = item.volition
        delete item.volition

        // 智力
        item.intelligence = item.brains
        delete item.brains

        // 精神
        item.spirit = item.charm
        delete item.charm

        // 角色
        item.role = roleType[item.career_address]
        return item
      })
    }
  } finally {

  }
}

/**
 * 购买角色
 */
async function buyPlayer(orderId: string, price: number) {
  ElMessage.info(`正在购买 ${orderId}, 价格为${price}`)
  const tx = await saleContractNew.buyPlayer(orderId, {
    gasLimit: autoBuy.gasLimit,
    gasPrice: utils.parseUnits(`${autoBuy.gasPrice}`, 'gwei'),
    nonce: null,
  })

  await tx.wait()
  console.log(`https://www.binaryx.pro/#/oneoffsale/detail/${orderId}`)
  ElMessage.success(`购买成功 ${orderId}, 价格为${price}`)
}

/**
 * 间隔修改时重新开启定时器
 */
function handleIntervalChange() {
  toggleShouldWatch(true)
  toggleShouldWatch(false)
}

/**
 * 切换监听
 * @param closed 是否关闭
 */
function toggleShouldWatch(closed?: boolean) {
  if (watchClosed.value || closed) {
    window.clearInterval(watchClosed.value)
    setWatchClosed(null as any)
  } else {
    setWatchClosed(setInterval(() => getList(), getListInterval.value))
  }
}

toggleShouldWatch()
</script>

<style lang="scss" scoped>
@import "./style.scss";
</style>
  