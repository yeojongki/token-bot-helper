<template>
  <a-form-item label="请选择池子类型">
    <a-select class="w-full" v-model:value="addTokenPoolType">
      <a-select-option :value="PoolType.UNKNOWN">未知</a-select-option>
      <a-select-option :value="PoolType.BNB">BNB</a-select-option>
      <a-select-option :value="PoolType.BUSD">BUSD</a-select-option>
      <a-select-option :value="PoolType.USDT">USDT</a-select-option>
    </a-select>
  </a-form-item>
  <a-form-item label="请输入合约地址" class="flex">
    <div class="flex">
      <a-input v-model:value="addTokenAddress" class="mr-10"></a-input>

      <async-button
        :api="onAddToken"
        class="ml-15"
        type="primary"
        :disabled="!addTokenAddress.length"
        >新增</async-button
      >
    </div>
  </a-form-item>

  <draggable
    class="token-list"
    @change="(userStore.handleTokenSort as any)"
    :list="userStore.userAddedTokens"
    item-key="address"
  >
    <template #item="{ element }">
      <li class="token-list-item mb-10">
        <div class="flex justify-between items-center">
          <div class="flex flex-1">
            <div class="item-symbol text-right">{{ element.symbol }}:</div>
            <div>
              {{
                element.address === WBNB_TOKEN.address
                  ? tokensStore.ethPrice
                  : formatTokenPrice(element, tokensStore.ethPrice)
              }}
            </div>
          </div>
          <div>
            <a-button
              size="small"
              :danger="element.skipWatch ? true : false"
              :type="element.skipWatch ? 'default' : 'primary'"
              @click="
                userStore.toggleSkipWatchToken({
                  chainId: element.chainId,
                  address: element.address,
                })
              "
              >{{ element.skipWatch ? '暂停中' : '观察中' }}</a-button
            >
            <a-dropdown-button size="small" class="ml-10">
              更多
              <template #overlay>
                <a-menu @click="handleCommond">
                  <a-menu-item
                    :command="{
                      name: Commond.COPY_ADDRESS,
                      chainId: element.chainId,
                      address: element.address,
                    }"
                    >复制地址</a-menu-item
                  >
                  <a-menu-item
                    divided
                    :disabled="element.address === WBNB_TOKEN.address"
                    :command="{
                      name: Commond.DELETE,
                      chainId: element.chainId,
                      address: element.address,
                    }"
                    >删除</a-menu-item
                  >
                </a-menu>
              </template>
            </a-dropdown-button>
          </div>
        </div>
      </li>
    </template>
  </draggable>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { PoolType } from '@/constants'
import { WBNB_TOKEN } from '@/constants/tokens'
import { useUserStore } from '@/store/user'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { TokenPoolType, TokenWithPrice, useTokensStore } from '@/store/tokens'
import { useRef } from '@/hooks/useRef'
import copyText from '@/utils/copyText'
import { toNonExponential } from '@/utils'

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
  COPY_ADDRESS,
}

const tokensStore = useTokensStore()
const userStore = useUserStore()
const [addTokenAddress, setAddTokenAddress] = useRef('')

const [addTokenPoolType] = useRef('' as TokenPoolType)

/**
 * 新增 token
 */
const onAddToken = async () => {
  const token = await tokensStore.getTokenDetail(addTokenAddress.value)
  if (token) {
    userStore.addToken(token, addTokenPoolType.value)
    // reset empty
    setAddTokenAddress('')
  }
}

/**
 * 格式化 token 价格 (限制长度)
 */
const formatTokenPrice = (
  token: TokenWithPrice,
  ethPrice: number,
  emptyPrice = '-',
) => {
  const { price, poolType } = token
  if (!price) return emptyPrice

  let actuallyPrice = Number(price)
  switch (poolType) {
    case PoolType.BNB:
      actuallyPrice *= ethPrice
      break

    default:
      break
  }

  return String(toNonExponential(actuallyPrice))
}

/**
 * 处理 dropdown 命令
 */
const handleCommond = ({ item }: any) => {
  const { name, chainId, address } = item.command

  switch (name) {
    case Commond.DELETE:
      userStore.removeAddedToken({ chainId, address })
      break

    case Commond.COPY_ADDRESS:
      copyText(address)
      break

    default:
      break
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
