<template>
  <a-card class="page-bnx">
    <template #title>
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
      <template #title>
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
          v-model:value="getListInterval"
          :step-strictly="true"
          :step="100"
        ></a-input-number>
      </div>
    </a-card>

    <a-card class="mt-20">
      <template #title>
        <div class="flex items-center">
          <div class="mr-10">自动购买配置</div>
          <a-switch
            class="ml-10"
            v-model:checked="autoBuy.open"
            :active-text="autoBuy.open ? '已开启' : '已关闭'"
          ></a-switch>
        </div>
      </template>

      <a-row :gutter="20" align="middle">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">零工最高价:</div>
            <a-input-number
              v-model:value="autoBuy.partTimePrice"
              :step-strictly="true"
              :step="0.01"
            ></a-input-number>
          </div>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">Gas Price:</div>
            <a-input-number
              v-model:value="autoBuy.gasPrice"
              :step-strictly="true"
              :step="1"
            ></a-input-number>
          </div>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8">
          <div class="flex items-center ml-10 mb-10">
            <div class="mr-10">Gas Limit:</div>
            <a-input-number
              v-model:value="autoBuy.gasLimit"
              :step-strictly="true"
              :step="10000"
            ></a-input-number>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="mt-20 mb-20">
      <template #title>搜索参数</template>
      <a-form
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 15 }"
        :model="searchParams"
        ref="searchForm"
      >
        <a-row>
          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="状态">
              <a-select v-model:value="searchParams.status">
                <a-select-option value="">全部</a-select-option>
                <a-select-option value="selling">出售中</a-select-option>
                <a-select-option value="finish">已结束</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="品质">
              <a-select v-model:value="searchParams.props">
                <a-select-option value="">全部</a-select-option>
                <a-select-option value="1">传奇</a-select-option>
                <a-select-option value="2">史诗</a-select-option>
                <a-select-option value="3">精英</a-select-option>
                <a-select-option value="4">优秀</a-select-option>
                <a-select-option value="5">普通</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="角色">
              <a-select v-model:value="searchParams.career">
                <a-select-option value="">全部</a-select-option>
                <a-select-option
                  v-for="item in roleList"
                  :label="item.name"
                  :value="item.value"
                  >{{ item.name }}</a-select-option
                >
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="排序属性">
              <a-select v-model:value="searchParams.sort">
                <a-select-option value="total">总属性值</a-select-option>
                <a-select-option value="price">价格</a-select-option>
                <a-select-option value="time">时间</a-select-option>
                <a-select-option value="strength">力量</a-select-option>
                <a-select-option value="agility">敏捷</a-select-option>
                <a-select-option value="physique">体质</a-select-option>
                <a-select-option value="volition">意志</a-select-option>
                <a-select-option value="brains">智力</a-select-option>
                <a-select-option value="charm">精神</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="升降序">
              <a-select v-model:value="searchParams.direction">
                <a-select-option value="desc">降序</a-select-option>
                <a-select-option value="asc">升序</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :sm="24" :md="12" :lg="8">
            <a-form-item label="分页数量">
              <a-input-number
                class="w-full"
                v-model:value="searchParams.page_size"
                :step="1"
                :step-strictly="true"
              ></a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :span="24">
            <a-form-item :label-col="{ span: 0 }" :wrapper-col="{ span: 24 }">
              <div class="flex justify-center w-full">
                <a-button type="primary" @click="saveSearchParams2Storage"
                  >保存参数</a-button
                >
                <a-button class="ml-10" @click="resetSearchForm">重置</a-button>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 市场列表表格 -->
    <player-table
      ref="actionRef"
      :init-data-on-setup="false"
      :hide-loading="true"
      :api="getList"
      :is-marketing="true"
      :on-selectionChange="selectionChange"
    >
      <template #title>
        <a-button
          type="primary"
          :disabled="!selection.length"
          @click="buySelected"
          >购买选中</a-button
        >
      </template>
    </player-table>
  </a-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { utils } from 'ethers'
import { effect, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import qs from 'qs'
import { message } from 'ant-design-vue'
import { useRef } from '@/hooks/useRef'
import {
  checkIsAdvancePlayer,
  getHeroMainProp,
  getPaybackCycle,
  roleType,
  roleList,
  getSaleContract,
} from './common'
import type { Hero, WorkingHero, ActionType } from './common'
import { promisePoll } from '@/utils'
import { get } from '@/utils/request'
import { useBnxStore } from '@/store/bnx'
import BnxGoldPriceBalance from './components/BnxGoldPriceBalance.vue'
import { bnxNamespace } from '@/constants/namespace'
import { getFromStorage, setToStorage } from '@/utils/storage'
import PlayerTable from './components/PlayerTable.vue'

/**
 * 市场列表接口地址
 */
// https://xs32rpc4.dsceshi.cn/getSales
// https://market.binaryx.pro/getSales
const apiUrl = 'https://market.binaryx.pro/info/getSales'
const router = useRouter()
const { wallet } = useActiveProvider()
const bnxStore = useBnxStore()
const saleContractNew = getSaleContract(wallet)

/**
 * form 表单 ref
 */
const searchForm = ref()

const actionRef = ref(undefined as ActionType | undefined)

/**
 * 请求列表间隔
 */
const getListInterval = ref(2000)

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
  props: '',
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
 * 获取搜索属性
 * 全部"" "" / 传奇 401-0 / 史诗 371-400 / 精英 321-370 / 优秀 251-320 / 普通 0-250
 */
function _getSearchStartEndValue(props: string) {
  if (props === '1') {
    return {
      start_value: '',
      end_value: '',
    }
  } else if (props === '2') {
    return {
      start_value: '',
      end_value: '',
    }
  } else if (props === '3') {
    return {
      start_value: '',
      end_value: '',
    }
  } else if (props === '4') {
    return {
      start_value: '',
      end_value: '',
    }
  } else if (props === '5') {
    return {
      start_value: '',
      end_value: '',
    }
  }

  return {
    start_value: '',
    end_value: '',
  }
}

/**
 * 获取市场列表
 */
async function getList(page = 1) {
  try {
    const params = {
      page,
      ...searchParams,
      ..._getSearchStartEndValue(searchParams.props),
    }

    const { code, data } = await get(apiUrl, params)
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
    }
  } catch (err) {
    message.error('请求失败')
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

  const messageKey = 'buyPlayer'
  message.loading({
    duration: 0,
    content: msg,
    key: messageKey,
  })
  try {
    const tx = await saleContractNew.buyPlayer(orderId, {
      gasLimit: autoBuy.gasLimit,
      gasPrice: utils.parseUnits(`${autoBuy.gasPrice}`, 'gwei'),
    })
    console.log({ tx })

    await tx.wait()

    console.log(`https://www.binaryx.pro/#/oneoffsale/detail/${orderId}`)

    message.success({
      key: messageKey,
      content: `购买成功 ${orderId}, 价格为${price}`,
    })
    // 刷新 bnx 余额
    bnxStore.updateBnxAndGoldBalance()
  } catch (error) {
    message.error({
      key: messageKey,
      content: `已被购买或发生错误`,
    })
    console.error(error)
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
let pollList = promisePoll(
  async () => actionRef.value?.refresh(),
  getListInterval.value,
)

effect(() => {
  if (watchOpened.value) {
    pollList.start()
  } else {
    pollList.stop()
  }
})

// 卸载移除轮训定时器
onUnmounted(() => {
  pollList.stop()
})
</script>

<style lang="less" scoped>
@import './style.less';
</style>
