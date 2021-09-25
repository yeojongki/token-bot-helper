<template>
  <div class="flex mt-10">
    <el-input v-model="addTokenAddress" class="mr-10"></el-input>
    <async-button
      :api="onAddToken"
      class="ml-15"
      type="primary"
      :disabled="!addTokenAddress.length"
    >新增</async-button>
  </div>
  <ul class="token-list" style="overflow: auto">
    <li v-for="i in userStore.userAddedTokens" class="token-list-item mb-10">
      <div class="flex justify-between items-center">
        <div class="flex flex-1">
          <div class="item-symbol text-right">{{ i.symbol }}:</div>
          <div>{{ i.address === WBNB_TOKEN.address ? priceStore.ethPrice : formatTokenPrice(i.price) }}</div>
        </div>
        <div>
          <el-button size="small" type="primary" @click="copyTokenAddress(i.address)">地址</el-button>
          <el-button
            size="small"
            type="danger"
            @click="userStore.removeAddedToken({ chainId: i.chainId, address: i.address })"
          >删除</el-button>
        </div>
      </div>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElButton, ElInput } from 'element-plus'
import { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import type { TokenInfo } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { usePriceStore } from '@/store/price'
import { WETHTokenAddress } from '@/constants'
import { useUserStore } from '@/store/user'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { Fetcher } from '@pancakeswap/sdk'
import { useTokenListStore } from '@/store/tokenList'
import useStore from 'element-plus/lib/components/table/src/store'
import { useRef } from '@/hooks/useRef'
import copyText from '@/utils/copyText'

const { chainId, provider } = useActiveProvider()
const priceStore = usePriceStore()
const tokenListStore = useTokenListStore()
const userStore = useUserStore()
const WBNB_ADDRESS = WBNB_TOKEN.address

const [addTokenAddress, setAddTokenAddress] = useRef('')
const onAddToken = async () => {
  const token = await tokenListStore.getTokenDetail(addTokenAddress.value)
  if (token) {
    userStore.addToken(token)
    // reset empty
    setAddTokenAddress('')
  }
}

// 格式化 token 价格 (限制长度)
const formatTokenPrice = (price?: number | string) => {
  if (!price) return '-'
  return String(price).slice(0, 12)
}

// 复制 token 地址
const copyTokenAddress = (address: string) => {
  copyText(address)
}

onMounted(() => {
  const { provider } = useActiveProvider()
  withPoll(async () => {
    userStore.userAddedTokens.forEach(({ chainId, address }) => {
      if (address === WBNB_TOKEN.address ||
        address === USDT_TOKEN.address ||
        address === BUSD_TOKEN.address) {
        // userStore.updateAddedToken(address, 6.4)
      } else {
        getTokenPrice(address, WBNB_TOKEN.address, provider, priceStore.ethPrice).then(price => {
          userStore.updateAddedTokenPrice({ chainId, address, price })
        }).catch(err => {
          console.log(err);
        })
      }
    })
    return undefined
  }, { interval: 400 })
})
</script>

<style lang="scss" scoped>
.item-symbol {
  width: 20%;
  margin-right: 5px;
  font-weight: bold;
  word-break: break-word;
}
</style>
