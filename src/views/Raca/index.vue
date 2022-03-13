<template>
  <div class="marketing">
    <div class="flex">
      <div
        @click="onNavChange(17)"
        :class="{ 'nav-item': true, 'is-active': query.category === 17 }"
      >
        蛋
      </div>
      <div
        @click="onNavChange(13)"
        :class="{ 'nav-item': true, 'is-active': query.category === 13 }"
      >
        元兽
      </div>
      <div
        @click="onNavChange(15)"
        :class="{ 'nav-item': true, 'is-active': query.category === 15 }"
      >
        药水
      </div>
    </div>

    <a-list :loading="loading" :data-source="list">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta
            :description="`总价: ${formatCount(
              Number(item.fixed_price) * item.count,
            )} / 数量: ${item.count}`"
          >
            <template #title> {{ item.name }} #{{ item.id }} </template>
            <template #avatar>
              <a-avatar :src="item.image_url" />
            </template>
          </a-list-item-meta>
          <template #actions>
            <a @click="buy(item.id, Number(item.fixed_price) * item.count)"
              >购买</a
            >
            <a
              target="_blank"
              :href="`https://market.radiocaca.com/#/market-place/${item.id}`"
              >详情</a
            >
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { get } from '@/utils/request'
import { Contract, utils } from 'ethers'
import { reactive, ref } from 'vue'
import { address } from './common'
import fixPriceSellABI from './abi/fixPriceSell'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useRef } from '@/hooks/useRef'

const { wallet } = useActiveProvider()

/**
 * 加载 loading
 */
const [loading, setLoading] = useRef(false)

const contracts = {
  [address.FIX_PRICE_SELL_ADDRESS]: new Contract(
    address.FIX_PRICE_SELL_ADDRESS,
    fixPriceSellABI,
    wallet,
  ),
}

const list = ref(
  [] as {
    id: number
    count: number
    id_in_contract: string
    name: string
    image_url: string
    fixed_price: string
  }[],
)

/**
 * 搜索参数
 */
const query = reactive({
  pageNo: 1,
  pageSize: 50,
  sortBy: 'fixed_price',
  name: '',
  order: 'asc',
  saleType: '',
  category: 13,
  tokenType: '',
})

/**
 * 切换分类
 */
const onNavChange = (category: number) => {
  query.category = category
  handleSearch()
}

/**
 * 搜索
 */
const handleSearch = async () => {
  try {
    loading.value = true
    const res = await get('https://market-api.radiocaca.com/nft-sales', query)
    if (res.code === 200) {
      list.value = res.list
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 格式化价格
 */
const formatCount = (price: number) => new Intl.NumberFormat().format(price)

/**
 * 购买
 */
const buy = async (idInContract: string, price: number) => {
  setLoading(true)
  try {
    const tx = await contracts[address.FIX_PRICE_SELL_ADDRESS].executeAuction(
      idInContract,
      utils.parseEther(price + ''),
      {
        gasLimit: 230000,
        gasPrice: utils.parseUnits(`6`, 'gwei'),
      },
    )
    console.log(tx)
    await tx.wait()
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}

handleSearch()
</script>

<style lang="less" scoped>
.marketing {
  padding: 20px;
}

.ant-list-item-meta-avatar .ant-avatar {
  width: 50px;
  height: 50px;
}

.nav-item {
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  margin-right: 20px;
  &.is-active {
    color: #1dc9c2;
  }
}

.card-item {
  cursor: pointer;
  margin: 0 0 20px 20px;
}

.item-img {
  width: 200px;
  height: 200px;
}
</style>
