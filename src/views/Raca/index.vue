<template>
  <a-row class="card-list" justify="center">
    <a-card v-for="item in list" class="card-item" @click="goDetail(item.id)">
      <template #title>
        <div>{{ item.name }}: {{ formatCount(item.fixed_price) }}</div>
      </template>

      <img class="item-img" :src="item.image_url" />
    </a-card>
  </a-row>
</template>

<script setup lang="ts">
import { get } from '@/utils/request'
import { ref } from 'vue'

const list = ref(
  [] as { id: number; name: string; image_url: string; fixed_price: string }[],
)
get('https://market-api.radiocaca.com/nft-sales', {
  pageNo: 1,
  pageSize: 20,
  sortBy: 'fixed_price',
  name: '',
  order: 'asc',
  saleType: '',
  category: 13,
  tokenType: '',
}).then(res => {
  if (res.code === 200) {
    list.value = res.list
  }
})

const formatCount = (price: string) =>
  new Intl.NumberFormat().format(Number(price))

const goDetail = (id: number) => {
  window.open(`https://market.radiocaca.com/#/market-place/${id}`, '_blank')
}
</script>

<style scoped>
.card-list {
  padding: 20px 20px 0 0;
}
.card-item {
  cursor: pointer;
  margin: 0 0 20px 20px;
}

.item-img {
  width: 260px;
  height: 260px;
}
</style>
