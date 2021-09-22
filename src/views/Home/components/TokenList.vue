<template>
  <ul class="token-list" style="overflow: auto">
    <li v-for="i in list" class="token-list-item">{{ i.symbol }}: {{ i.price || '-' }}</li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import tokens, { BUSD_TOKEN, TokenInfo, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { usePriceStore } from '@/store/price'
import { WETHTokenAddress } from '@/constants'

const priceStore = usePriceStore()
const list = reactive<{ [k: string]: TokenInfo }>({
  ...tokens,
  '0x12bb890508c125661e03b09ec06e404bc9289040': {
    address: '0x12bb890508c125661e03b09ec06e404bc9289040'
  }
})

const setTokenPrice = (address: string, price: number) => {
  list[address].price = price
}

onMounted(() => {
  const { provider } = useActiveProvider()


  withPoll(async () => {
    Object.keys(list).map(address => {
      if (address === WBNB_TOKEN.address) {
        setTokenPrice(address, priceStore.ethPrice)
      } else if (address === USDT_TOKEN.address || address === BUSD_TOKEN.address) {
        setTokenPrice(address, 6.4)
      } else {
        getTokenPrice(address, WBNB_TOKEN.address, provider, priceStore.ethPrice).then(price => {
          setTokenPrice(address, price)
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