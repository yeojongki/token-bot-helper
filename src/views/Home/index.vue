<template>
  <main class="home">
    <Row :gutter="20">
      <Col :xs="24" :md="12">
        <Card header="代币列表" class="mt-20">
          <watch-list></watch-list>
        </Card>
      </Col>

      <Col :xs="24" :md="12">
        <Card header="用户配置" class="mt-20">
          <user-config></user-config>
        </Card>
      </Col>

      <Col :xs="24" :md="12" :lg="12">
        <Card header="交易区" class="mt-20">
          <bot></bot>
        </Card>
      </Col>
    </Row>
  </main>
</template>

<script setup lang="ts">
import { Row, Col, Card } from 'ant-design-vue'
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
