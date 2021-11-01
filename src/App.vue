<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
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
  <ElConfigProvider :locale="zhCn">
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<style>
@import 'normalize.css';
@import './styles/global.scss';
</style>
