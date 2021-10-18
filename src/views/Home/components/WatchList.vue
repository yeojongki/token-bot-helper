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
  <draggable
    class="token-list"
    @change="userStore.handleTokenSort"
    :list="userStore.userAddedTokens"
    item-key="address"
  >
    <template #item="{ element }">
      <li class="token-list-item mb-10">
        <div class="flex justify-between items-center">
          <div class="flex flex-1">
            <div class="item-symbol text-right">{{ element.symbol }}:</div>
            <div>{{ element.address === WBNB_TOKEN.address ? tokensStore.ethPrice : formatTokenPrice(element.price ? (tokensStore.ethPrice * Number(element.price)) : null) }}</div>
          </div>
          <div>
            <el-button
              size="small"
              :type="element.skipWatch ? 'info' : 'danger'"
              @click="userStore.toggleSkipWatchToken({ chainId: element.chainId, address: element.address })"
            >{{ element.skipWatch ? '暂停中' : '观察中' }}</el-button>
            <el-dropdown @command="handleCommond" size="small" class="ml-10">
              <el-button size="small" type="primary">
                更多
                <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="{ name: Commond.COPY_ADDRESS, chainId: element.chainId, address: element.address }"
                  >复制地址</el-dropdown-item>
                  <el-dropdown-item
                    divided
                    :command="{ name: Commond.DELETE, chainId: element.chainId, address: element.address }"
                  >删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </li>
    </template>
  </draggable>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import draggable from 'vuedraggable'
import { ElButton, ElInput, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import tokens, { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import type { TokenInfo } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { WETHTokenAddress } from '@/constants'
import { useUserStore } from '@/store/user'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { ChainId, Fetcher } from '@pancakeswap/sdk'
import { useTokensStore } from '@/store/tokens'
import useStore from 'element-plus/lib/components/table/src/store'
import { useRef } from '@/hooks/useRef'
import copyText from '@/utils/copyText'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { utils } from 'ethers'

/**
 * dropdown 命令枚举
 */
enum Commond {
  /**
   * 删除 token
   */
  DELETE,
  /**
    * 复制 token 地址
    */
  COPY_ADDRESS
}

const tokensStore = useTokensStore()
const userStore = useUserStore()
const WBNB_ADDRESS = WBNB_TOKEN.address

const { provider } = useActiveProvider()
const [addTokenAddress, setAddTokenAddress] = useRef('')

/**
 * 新增 token
 */
const onAddToken = async () => {
  const token = await tokensStore.getTokenDetail(addTokenAddress.value)
  if (token) {
    userStore.addToken(token)
    // reset empty
    setAddTokenAddress('')
  }
}

/**
 * 格式化 token 价格 (限制长度)
 */
const formatTokenPrice = (price?: unknown) => {
  if (!price) return '-'
  return String(price).slice(0, 12)
}

/**
 * 处理 dropdown 命令
 */
const handleCommond = (commond: { name: Commond, chainId: ChainId, address: string }) => {
  const { name, chainId, address } = commond

  switch (commond.name) {
    case Commond.DELETE:
      userStore.removeAddedToken({ chainId, address })
      break;

    case Commond.COPY_ADDRESS:
      copyText(address)
      break;

    default:
      break;
  }
}

// 轮训价格
tokensStore.pollWatchListPrice()
</script>

<style lang="scss" scoped>
.token-list {
  padding-top: 20px;
}
.item-symbol {
  width: 25%;
  margin-right: 5px;
  font-weight: bold;
  word-break: break-word;
}
</style>
