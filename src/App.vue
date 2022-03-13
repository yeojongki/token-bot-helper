<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useNonceStore } from './store/nonce'
import { useTokensStore } from './store/tokens'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup

// update bnb price
const tokenListStore = useTokensStore()
tokenListStore.updateEthPrice()

// update nonce
const nonceStore = useNonceStore()
nonceStore.updateLatestNonce()
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <RouterView></RouterView>
  </ConfigProvider>
</template>

<style>
@import 'normalize.css';
@import './styles/global.less';
</style>
