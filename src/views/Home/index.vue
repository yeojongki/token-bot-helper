<template>
  <main class="home">
    <a-row :gutter="20">
      <a-col :xs="24" :md="12">
        <a-card header="代币列表" class="mt-20">
          <watch-list></watch-list>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="12">
        <a-card header="用户配置" class="mt-20">
          <user-config></user-config>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="12" :lg="12">
        <a-card header="交易区" class="mt-20">
          <bot></bot>
        </a-card>
      </a-col>
    </a-row>
  </main>
</template>

<script setup lang="ts">
import Bot from './components/Bot.vue'
import WatchList from './components/WatchList.vue'
import UserConfig from './components/UserConfig.vue'
</script>

<style scoped>
.home {
  margin: 0 !important;
  padding: 0 20px 20px;
}
</style>
