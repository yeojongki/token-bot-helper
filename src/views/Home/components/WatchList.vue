<template>
  <div class="flex">
    <el-input v-model="addTokenAddress" class="mr-10"></el-input>
    <async-button
      :api="onAddToken"
      class="ml-15"
      type="primary"
      :disabled="!addTokenAddress.length"
    >新增</async-button>
  </div>
  <ul class="token-list">
    <li v-for="i in userStore.userAddedTokens" class="token-list-item mb-10">
      <div class="flex justify-between items-center">
        <div class="flex flex-1">
          <div class="item-symbol text-right">{{ i.symbol }}:</div>
          <div>{{ i.address === WBNB_TOKEN.address ? tokensStore.ethPrice : formatTokenPrice(i.price ? (tokensStore.ethPrice / Number(i.price)) : null) }}</div>
        </div>
        <div>
          <el-button size="small" type="primary" @click="copyTokenAddress(i.address)">地址</el-button>
          <el-button
            size="small"
            :type="i.skipWatch ? 'info' : 'success'"
            @click="userStore.toggleSkipWatchToken({ chainId: i.chainId, address: i.address })"
          >{{ i.skipWatch ? '暂停中' : '观察中' }}</el-button>
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
import tokens, { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import type { TokenInfo } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { WETHTokenAddress } from '@/constants'
import { useUserStore } from '@/store/user'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { Fetcher } from '@pancakeswap/sdk'
import { useTokensStore } from '@/store/tokens'
import useStore from 'element-plus/lib/components/table/src/store'
import { useRef } from '@/hooks/useRef'
import copyText from '@/utils/copyText'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { utils } from 'ethers'

const tokensStore = useTokensStore()
const userStore = useUserStore()
const WBNB_ADDRESS = WBNB_TOKEN.address

const { provider } = useActiveProvider()
const [addTokenAddress, setAddTokenAddress] = useRef('')
const onAddToken = async () => {
  const token = await tokensStore.getTokenDetail(addTokenAddress.value)
  if (token) {
    userStore.addToken(token)
    // reset empty
    setAddTokenAddress('')
  }
}

// 格式化 token 价格 (限制长度)
const formatTokenPrice = (price?: unknown) => {
  if (!price) return '-'
  return String(price).slice(0, 12)
}

// 复制 token 地址
const copyTokenAddress = (address: string) => {
  copyText(address)
}

// 轮训价格
tokensStore.pollWatchListPrice()
</script>

<style lang="scss" scoped>
.token-list {
  padding-top: 20px;
}
.item-symbol {
  width: 20%;
  margin-right: 5px;
  font-weight: bold;
  word-break: break-word;
}
</style>
