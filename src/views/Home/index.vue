<template>
  <el-row class="home" :gutter="20">
    <el-col :span="10">
      <el-card header="观察区">
        <token-list></token-list>
      </el-card>
    </el-col>

    <el-col :span="14">
      <el-card header="买入区">
        <bot></bot>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElRow, ElCol, ElCard } from 'element-plus'
import Bot from "./components/Bot.vue";
import TokenList from "./components/TokenList.vue"
</script>

<style scoped>
.home {
  padding: 10px;
}
</style>
