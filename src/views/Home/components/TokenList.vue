<template>
  <div class="flex items-center">
    <div>观察区:</div>
  </div>
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
    <li
      v-for="i in userStore.userAddedTokens"
      class="token-list-item"
    >{{ i.symbol }}: {{ i.address === WBNB_TOKEN.address ? priceStore.ethPrice : (i.price || '-') }}</li>
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

const { chainId, provider } = useActiveProvider()
const priceStore = usePriceStore()
const tokenListStore = useTokenListStore()
const userStore = useUserStore()
const WBNB_ADDRESS = WBNB_TOKEN.address

const addTokenAddress = ref('')
const onAddToken = async () => {
  const token = await tokenListStore.getTokenDetail(addTokenAddress.value)
  if (token) {
    userStore.addToken(token)
  }
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
  }, { interval: 1000 })
})
</script>

<style lang="scss">
.infinite-list {
  height: 300px;
  padding: 0;
  margin: 0;
  list-style: none;

  .infinite-list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    background: var(--el-color-primary-light-9);
    margin: 10px;
    color: var(--el-color-primary);
    & + .list-item {
      margin-top: 10px;
    }
  }
}
</style>