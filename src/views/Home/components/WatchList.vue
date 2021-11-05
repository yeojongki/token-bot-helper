<template>
  <div class="flex">
    <Input v-model="addTokenAddress" class="mr-10"></Input>
    <async-button
      :api="onAddToken"
      class="ml-15"
      type="primary"
      :disabled="!addTokenAddress.length"
      >新增</async-button
    >
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
            <div>
              {{
                element.address === WBNB_TOKEN.address
                  ? tokensStore.ethPrice
                  : formatTokenPrice(
                      element.price
                        ? tokensStore.ethPrice * Number(element.price)
                        : null,
                    )
              }}
            </div>
          </div>
          <div>
            <Button
              size="small"
              :danger="element.skipWatch ? true : false"
              :type="element.skipWatch ? 'default' : undefined"
              @click="
                userStore.toggleSkipWatchToken({
                  chainId: element.chainId,
                  address: element.address,
                })
              "
              >{{ element.skipWatch ? '暂停中' : '观察中' }}</Button
            >
            <DropdownButton size="small" class="ml-10">
              更多
              <template #overlay>
                <Menu @click="handleCommond">
                  <MenuItem
                    :command="{
                      name: Commond.COPY_ADDRESS,
                      chainId: element.chainId,
                      address: element.address,
                    }"
                    >复制地址</MenuItem
                  >
                  <MenuItem
                    divided
                    :command="{
                      name: Commond.DELETE,
                      chainId: element.chainId,
                      address: element.address,
                    }"
                    >删除</MenuItem
                  >
                </Menu>
              </template>
            </DropdownButton>
          </div>
        </div>
      </li>
    </template>
  </draggable>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { Button, Input, DropdownButton, Menu, MenuItem } from 'ant-design-vue'
import { WBNB_TOKEN } from '@/constants/tokens'
import { useUserStore } from '@/store/user'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { ChainId } from '@pancakeswap/sdk'
import { useTokensStore } from '@/store/tokens'
import { useRef } from '@/hooks/useRef'
import copyText from '@/utils/copyText'

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
const handleCommond = (commond: {
  name: Commond
  chainId: ChainId
  address: string
}) => {
  const { name, chainId, address } = commond

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
