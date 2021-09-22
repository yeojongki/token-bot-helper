<template>
  <el-row :gutter="20">
    <el-col :span="6">
      <token-list :eth-price="priceStore.ethPrice"></token-list>
    </el-col>

    <el-col :span="18">
      <bot></bot>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElRow, ElCol } from 'element-plus'
import { usePriceStore } from '@/store/price';
import Bot from "./components/Bot.vue";
import TokenList from "./components/TokenList.vue"

const priceStore = usePriceStore()
</script>
