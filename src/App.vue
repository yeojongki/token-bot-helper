<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useNonceStore } from './store/nonce';
import { useTokensStore } from './store/tokens';
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
  <RouterView></RouterView>
</template>

<style>
@import "normalize.css";
@import "./styles/global.scss";
</style>
