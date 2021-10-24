<template>
  <el-card class="page-bnx">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="mr-10">市场列表</div>
        </div>

        <div class="flex items-center">
          <bnx-gold-price-balance class="ml-10"></bnx-gold-price-balance>
        </div>
      </div>
    </template>
    <!-- <div class="mb-10 flex items-center">
      <el-button :disabled="!selection.length" class="ml-10" type="primary" @click="batchBuy">批量购买</el-button>
    </div>-->

    <el-card>
      <template #header>
        <div class="flex items-center">
          <div class="mr-10">列表配置</div>
          <el-button
            size="small"
            @click="toggleShouldWatch()"
            :type="watchOpened ? 'success' : 'info'"
          >{{ watchOpened ? '监听中' : '已关闭监听' }}</el-button>
        </div>
      </template>
      <div class="flex items-center mr-10">
        <div class="mr-10">刷新间隔:</div>
        <el-input-number
          size="small"
          @change="handleIntervalChange"
          v-model="getListInterval"
          :step-strictly="true"
          :step="100"
        ></el-input-number>
      </div>
    </el-card>

    <el-card class="mt-20">
      <template #header>
        <div class="flex items-center">
          <div class="mr-10">购买配置</div>
          <el-switch
            class="ml-10"
            v-model="autoBuy.open"
            :active-text="autoBuy.open ? '已开启自动购买' : '已关闭自动购买'"
          ></el-switch>
        </div>
      </template>
      <div class="flex items-center">
        <div class="flex items-center ml-10">
          <div class="mr-10">自动购买最低价:</div>
          <el-input-number
            size="small"
            v-model="autoBuy.minPrice"
            :step-strictly="true"
            :step="0.01"
          ></el-input-number>
        </div>

        <div class="flex items-center ml-10">
          <div class="mr-10">Gas Price:</div>
          <el-input-number size="small" v-model="autoBuy.gasPrice" :step-strictly="true" :step="1"></el-input-number>
        </div>

        <div class="flex items-center ml-10">
          <div class="mr-10">Gas Limit:</div>
          <el-input-number
            size="small"
            v-model="autoBuy.gasLimit"
            :step-strictly="true"
            :step="10000"
          ></el-input-number>
        </div>
      </div>
    </el-card>

    <el-card class="mt-20 mb-20" header="操作">
      <el-button type="primary" :disabled="!selection.length" @click="buySelected">购买选中</el-button>
    </el-card>

    <!-- :default-sort="{ prop: 'price', order: 'ascending' }" -->
    <el-table
      row-key="tokenId"
      :height="500"
      :data="marketList"
      :border="true"
      @selection-change="selectionChange"
    >
      <!-- 封装属性列 -->
      <props-column :is-marketing="true"></props-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { Contract } from '@ethersproject/contracts'
import {
  ElCard,
  ElSwitch,
  ElInputNumber,
  ElTable,
  ElButton,
  ElMessage,
  ElNotification,
} from 'element-plus'
import { utils } from 'ethers'
import { promisePoll } from '@/utils'
import { effect, onUnmounted, reactive, ref } from 'vue'
import { useRef } from '@/hooks/useRef'
import {
  checkIsAdvancePlayer,
  getHeroMainProp,
  getPaybackCycle,
  roleType,
} from './common'
import type { Hero, WorkingHero } from './common'
import { get } from '@/utils/request'
import SaleNewABI from './abi/saleNew'
import PropsColumn from './components/PropsColumn.vue'
import { useBnxStore } from '@/store/bnx'
import BnxGoldPriceBalance from './components/BnxGoldPriceBalance.vue'

const { wallet } = useActiveProvider()
const bnxStore = useBnxStore()
const newSaleAddress = '0x1416e6EA40CBb1F09Cd2dbEdAAd6fbFE3e38D51F'
const saleContractNew = new Contract(newSaleAddress, SaleNewABI, wallet)

/**
 * 请求列表间隔
 */
const getListInterval = ref(500)

/**
 * true 开启
 * false 关闭
 */
const [watchOpened, setWatchOpened] = useRef<boolean>(true)
const marketList = ref([])

/**
 * 正在购买的角色 token ID map
 */
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
  minPrice: 0.45,
  gasLimit: 540000,
  gasPrice: 6,
})

/**
 * 列表选中
 */
const selection = ref<WorkingHero[]>([])

/**
 * 交易代币 map
 */
const payTokenTypeMap: Record<string, Hero['payType']> = {
  [bnxStore.bnxAddress]: 'BNX',
  [bnxStore.goldAddress]: 'GOLD',
}

/**
 * 列表勾选事件
 */
function selectionChange(val: WorkingHero[]) {
  selection.value = val

  if (watchOpened.value) {
    // 停止刷新列表防止勾选重置
    toggleShouldWatch(true)
  }
}

/**
 * 获取市场列表
 */
async function getList(page = 1, options?: object) {
  try {
    const params = {
      page,
      page_size: 70,
      status: 'selling',
      name: '',
      // sort: 'price',
      // direction: 'asc',
      direction: 'desc',
      sort: 'time',
      career: '',
      ...options,
    }

    const { code, data } = await get(`/bnxApi/getSales`, params)
    if (code === 0 && data?.result && data?.result?.items) {
      const items = data.result.items || []
      // 关闭监听之后不刷新列表
      if (!watchOpened.value) {
        return
      }

      marketList.value = items.map(
        (item: Hero & { price: number } & Record<string, any>) => {
          // 价格
          item.price = Number(utils.formatEther(item.price))

          // 自动购买
          if (
            autoBuy.open &&
            item.price <= autoBuy.minPrice &&
            !currentBuying[item.order_id]
          ) {
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

          // 角色地址
          item.roleAddress = item.career_address
          delete item.career_address

          // 角色
          item.role = roleType[item.roleAddress]

          // 高级工
          item.isAdvance = checkIsAdvancePlayer([
            [
              item.strength,
              item.agility,
              item.constitution,
              item.willpower,
              item.intelligence,
              item.spirit,
              item.level,
            ],
            item.roleAddress,
          ])

          // 交易代币类型
          // warn: 可能以后会有其他类型
          item.payType = payTokenTypeMap[item.pay_addr]
          item.usdPrice =
            item.payType === 'BNX'
              ? Number((bnxStore.bnxPrice * item.price).toFixed(2))
              : Number((bnxStore.goldPrice * item.price).toFixed(2))

          // 主属性
          item.mainProp = getHeroMainProp(item)

          // 回本周期
          if (item.isAdvance) {
            item.paybackCycle3 = getPaybackCycle({
              ...item,
              usdPrice: item.usdPrice,
              bnxPrice: bnxStore.bnxPrice,
              goldPrice: bnxStore.goldPrice,
              targetLevel: 3,
            })
            item.paybackCycle4 = getPaybackCycle({
              ...item,
              usdPrice: item.usdPrice,
              bnxPrice: bnxStore.bnxPrice,
              goldPrice: bnxStore.goldPrice,
              targetLevel: 4,
            })
            item.paybackCycle5 = getPaybackCycle({
              ...item,
              usdPrice: item.usdPrice,
              bnxPrice: bnxStore.bnxPrice,
              goldPrice: bnxStore.goldPrice,
              targetLevel: 5,
            })

            // 取最小值
            item.paybackCycle = Math.min(
              item.paybackCycle3,
              item.paybackCycle4,
              item.paybackCycle5,
            )
            // 最小值对应等级
            item.paybackCycleLevel =
              item.paybackCycle === item.paybackCycle3
                ? 3
                : item.paybackCycle === item.paybackCycle4
                  ? 4
                  : item.paybackCycle === item.paybackCycle5
                    ? 5
                    : 0
          } else {
            item.paybackCycle = getPaybackCycle({
              ...item,
              usdPrice: item.usdPrice,
              bnxPrice: bnxStore.bnxPrice,
              goldPrice: bnxStore.goldPrice,
              targetLevel: 1,
            })
          }

          return item
        },
      )
      // .sort((a: any, b: any) => a.block_number - b.block_number)
    }
  } catch (err) {
    ElNotification.error!({
      message: '请求失败',
    })
  }
}

/**
 * 购买选中角色
 */
async function buySelected() {
  selection.value.map((item) => {
    if (bnxStore.bnxBalance >= item.price) {
      buyPlayer(item.order_id, item.price)
    } else {
      ElMessage.error('余额不足')
      console.error('余额不足')
    }
  })
}

/**
 * 购买角色
 */
async function buyPlayer(orderId: string, price: number) {
  const message = `正在购买 ${orderId}, 价格为${price}`
  const buyingMsg = ElMessage({
    type: 'info',
    duration: 0,
    message,
  })
  console.log(message)
  try {
    const tx = await saleContractNew.buyPlayer(orderId, {
      gasLimit: autoBuy.gasLimit,
      gasPrice: utils.parseUnits(`${autoBuy.gasPrice}`, 'gwei'),
    })
    console.log({ tx })

    await tx.wait()

    console.log(`https://www.binaryx.pro/#/oneoffsale/detail/${orderId}`)

    ElMessage.success(`购买成功 ${orderId}, 价格为${price}`)
    // 刷新 bnx 余额
    bnxStore.updateBnxAndGoldBalance()
  } catch (error) {
    ElMessage.error(`已被购买或发生错误`)
    console.error(error)
  } finally {
    buyingMsg.close()
  }
}

/**
 * 间隔修改时重新开启定时器
 */
function handleIntervalChange() {
  pollList.setWait(getListInterval.value)
  pollList.stop()
  pollList.start()
}

/**
 * 切换监听
 * @param closed 是否关闭
 */
function toggleShouldWatch(closed?: boolean) {
  if (closed !== undefined) {
    setWatchOpened(closed)
  } else {
    setWatchOpened(!watchOpened.value)
  }

  if (watchOpened.value) {
    // 更新 bnx gold 价格和余额
    bnxStore.updateBnxAndGold()
  }
}

// 更新 bnx gold 价格和余额
bnxStore.updateBnxAndGold()

// 更新列表
let pollList = promisePoll(async () => {
  await getList()
}, getListInterval.value)

effect(() => {
  if (watchOpened.value) {
    pollList.start()
  } else {
    pollList.stop()
  }
})

// 执行
pollList.start()

// 卸载移除轮训定时器
onUnmounted(() => {
  pollList.stop()
})
</script>

<style lang="scss" scoped>
@import "./style.scss";
</style>
