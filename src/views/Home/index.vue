<template>
  <el-row class="home" :gutter="20">
    <el-col :span="9">
      <token-list></token-list>
    </el-col>

    <el-col :span="13">
      <bot></bot>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElRow, ElCol } from 'element-plus'
import Bot from "./components/Bot.vue";
import TokenList from "./components/TokenList.vue"
</script>

<style scoped>
.home {
  padding: 10px;
}
</style>
