<template>
  <a-card class="page-bnx">
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
      <a-button :disabled="!selection.length" class="ml-10" type="primary" @click="batchBuy">批量购买</a-button>
    </div>-->

    <a-card>
      <template #header>
        <div class="flex items-center">
          <div class="mr-10">列表配置</div>
          <a-button
            @click="toggleShouldWatch()"
            :type="watchOpened ? 'primary' : 'default'"
            >{{ watchOpened ? '监听中' : '已关闭监听' }}</a-button
          >
        </div>
      </template>
      <div class="flex items-center mr-10">
        <div class="mr-10">刷新间隔:</div>
        <a-input-number
          @change="handleIntervalChange"
          v-model="getListInterval"
          :step-strictly="true"
          :step="100"
        ></a-input-number>
      </div>
    </a-card>

    <a-card class="mt-20">
      <template #header>
        <div class="flex items-center">
          <div class="mr-10">自动购买配置</div>
          <a-switch
            class="ml-10"
            v-model="autoBuy.open"
            :active-text="autoBuy.open ? '已开启' : '已关闭'"
          ></a-switch>
        </div>
      </template>

      <a-row :gutter="20" align="middle">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">零工最高价:</div>
            <a-input-number
              v-model="autoBuy.partTimePrice"
              :step-strictly="true"
              :step="0.01"
            ></a-input-number>
          </div>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">Gas Price:</div>
            <a-input-number
              v-model="autoBuy.gasPrice"
              :step-strictly="true"
              :step="1"
            ></a-input-number>
          </div>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">Gas Limit:</div>
            <a-input-number
              v-model="autoBuy.gasLimit"
              :step-strictly="true"
              :step="10000"
            ></a-input-number>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="mt-20 mb-20" header="操作">
      <a-button
        type="primary"
        :disabled="!selection.length"
        @click="buySelected"
        >购买选中</a-button
      >
    </a-card>

    <a-card class="mt-20 mb-20" header="搜索参数">
      <a-form :model="searchParams" ref="searchForm">
        <a-form-item label="状态" name="status">
          <a-select v-model="searchParams.status">
            <a-select-option value label="全部"></a-select-option>
            <a-select-option value="selling" label="出售中"></a-select-option>
            <a-select-option value="finish" label="已结束"></a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="角色" name="career">
          <a-select v-model="searchParams.career">
            <a-select-option value label="全部"></a-select-option>
            <a-select-option
              v-for="item in roleList"
              :label="item.name"
              :value="item.value"
              >{{ item.name }}</a-select-option
            >
          </a-select>
        </a-form-item>

        <a-form-item label="排序属性" name="sort">
          <a-select v-model="searchParams.sort">
            <a-select-option value="total" label="总属性值"></a-select-option>
            <a-select-option value="price" label="价格"></a-select-option>
            <a-select-option value="time" label="时间"></a-select-option>
            <a-select-option value="strength" label="力量"></a-select-option>
            <a-select-option value="agility" label="敏捷"></a-select-option>
            <a-select-option value="physique" label="体质"></a-select-option>
            <a-select-option value="volition" label="意志"></a-select-option>
            <a-select-option value="brains" label="智力"></a-select-option>
            <a-select-option value="charm" label="精神"></a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="升降序" name="direction">
          <a-select v-model="searchParams.direction">
            <a-select-option value="desc" label="降序"></a-select-option>
            <a-select-option value="asc" label="升序"></a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="分页数量" name="page_size">
          <a-input-number
            v-model="searchParams.page_size"
            :step="1"
            :step-strictly="true"
          ></a-input-number>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="saveSearchParams2Storage"
            >保存参数</a-button
          >
          <a-button class="ml-10" @click="resetSearchForm">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 市场列表表格 -->
    <player-table
      :api="getList"
      :is-marketing="true"
      :on-selectionChange="selectionChange"
    ></player-table>
  </a-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { utils } from 'ethers'
import { effect, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import qs from 'qs'
import { useRef } from '@/hooks/useRef'
import {
  checkIsAdvancePlayer,
  getHeroMainProp,
  getPaybackCycle,
  roleType,
  roleList,
  getSaleContract,
} from './common'
import type { Hero, WorkingHero } from './common'
import { promisePoll } from '@/utils'
import { get } from '@/utils/request'
import { useBnxStore } from '@/store/bnx'
import BnxGoldPriceBalance from './components/BnxGoldPriceBalance.vue'
import { bnxNamespace } from '@/constants/namespace'
import { getFromStorage, setToStorage } from '@/utils/storage'
import PlayerTable from './components/PlayerTable.vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const { wallet } = useActiveProvider()
const bnxStore = useBnxStore()
const saleContractNew = getSaleContract(wallet)

/**
 * form 表单 ref
 */
const searchForm = ref()

/**
 * 请求列表间隔
 */
const getListInterval = ref(2500)

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
   * 购买零工最高价
   */
  partTimePrice: 0,
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
 * 存储搜索 key
 */
const BNX_SEARCH_KEY = 'searchParams'

/**
 * 读取 storage 中的搜索参数
 */
const storageSearchParams = getFromStorage<string>(bnxNamespace, BNX_SEARCH_KEY)

/**
 * 搜索参数
 */
const searchParams = reactive({
  status: 'selling',
  name: '',
  direction: 'desc',
  sort: 'time',
  career: '',
  page_size: 77,
  ...router.currentRoute.value.query,
  ...(storageSearchParams
    ? JSON.parse(storageSearchParams)
    : Object.create(null)),
})

/**
 * 列表勾选事件
 */
function selectionChange(val: WorkingHero[]) {
  selection.value = val
}

/**
 * 获取市场列表
 */
async function getList(page = 1) {
  try {
    const params = {
      page,
      page_size: 70,
      ...searchParams,
    }

    const { code, data } = await get(
      `https://xs32rpc4.dsceshi.cn/getSales`,
      params,
    )
    if (code === 0 && data?.result && data?.result?.items) {
      const items = data.result.items || []

      marketList.value = items.map(
        (item: Hero & { price: number } & Record<string, any>) => {
          // 价格
          item.price = Number(utils.formatEther(item.price))

          // 自动购买
          if (
            autoBuy.open &&
            item.price <= autoBuy.partTimePrice &&
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

      return marketList.value
      // .sort((a: any, b: any) => a.block_number - b.block_number)
    }
  } catch (err) {
    message.error!({
      message: '请求失败',
    })
  }
}

/**
 * 保存查询参数到 localStorage
 */
function saveSearchParams2Storage() {
  pollList.stop()
  pollList.start()

  const { path } = router.currentRoute.value
  const query = qs.stringify(searchParams)
  router.replace(`${path}?${query}`)

  setToStorage(bnxNamespace, BNX_SEARCH_KEY, JSON.stringify(searchParams))
}

/**
 * 重置表单
 */
function resetSearchForm() {
  searchForm.value.resetFields()
}

/**
 * 购买选中角色
 */
async function buySelected() {
  selection.value.map(item => {
    if (bnxStore.bnxBalance >= item.price) {
      buyPlayer(item.order_id, item.price)
    } else {
      message.error('余额不足')
      console.error('余额不足')
    }
  })
}

/**
 * 购买角色
 */
async function buyPlayer(orderId: string, price: number) {
  const msg = `正在购买 ${orderId}, 价格为${price}`
  const buyingMsg = message({
    type: 'info',
    duration: 0,
    message: msg,
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

    message.success(`购买成功 ${orderId}, 价格为${price}`)
    // 刷新 bnx 余额
    bnxStore.updateBnxAndGoldBalance()
  } catch (error) {
    message.error(`已被购买或发生错误`)
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

if (watchOpened.value) {
  // 执行
  // pollList.start()
}

// 卸载移除轮训定时器
onUnmounted(() => {
  pollList.stop()
})
</script>
