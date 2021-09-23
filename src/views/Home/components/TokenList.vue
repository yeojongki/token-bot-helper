<template>
  <ul class="token-list" style="overflow: auto">
    <li v-for="i in list" class="token-list-item">{{ i.symbol }}: {{ i.price || '-' }}</li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { TokenInfo, BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { usePriceStore } from '@/store/price'
import { WETHTokenAddress } from '@/constants'
import { useUserStore } from '@/store/user'

const priceStore = usePriceStore()
const { chainId } = useActiveProvider()
const userStore = useUserStore()
const list = reactive<{ [k: string]: TokenInfo }>({
  // [userStore.tokens[chainId]]
  [WBNB_TOKEN.address]: WBNB_TOKEN,
  '0x6b9f6f911384886b2e622e406327085238f8a3c5': {
    address: '0x6b9f6f911384886b2e622e406327085238f8a3c5'
  },
  '0x12bb890508c125661e03b09ec06e404bc9289040': {
    address: '0x12bb890508c125661e03b09ec06e404bc9289040'
  }
})

const setTokenPrice = (address: string, price: number) => {
  console.log({ address, price });

  list[address].price = price
}

onMounted(() => {
  const { provider } = useActiveProvider()


  withPoll(async () => {
    Object.keys(list).map(address => {
      if (address === WBNB_TOKEN.address) {
        setTokenPrice(address, priceStore.ethPrice)
      } else if (address === USDT_TOKEN.address || address === BUSD_TOKEN.address) {
        // setTokenPrice(address, 6.4)
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