<template>
  <main class="home">
    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card header="代币列表" class="mt-20">
          <watch-list></watch-list>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card header="用户配置" class="mt-20">
          <user-config></user-config>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" :lg="12">
        <el-card header="交易区" class="mt-20">
          <bot></bot>
        </el-card>
      </el-col>
    </el-row>
  </main>
</template>

<script setup lang="ts">
import { ElRow, ElCol, ElCard } from 'element-plus'
import Bot from "./components/Bot.vue"
import WatchList from "./components/WatchList.vue"
import UserConfig from './components/UserConfig.vue'
</script>

<style scoped>
.home {
  margin: 0 !important;
  padding: 0 20px 20px;
}
</style>
