<template>
  <a-form :model="config" ref="formRef" label-position="top">
    <a-form-item label="私钥" name="privateKey" :required="true">
      <a-input v-model="config.privateKey" type="password" />
    </a-form-item>

    <a-form-item label="节点" name="rpc" :required="true">
      <div class="flex w-full items-center">
        <a-select class="flex-1 mr-10" v-model="config.rpc">
          <a-select-option v-for="item in userStore.rpcList" :key="item" :value="item">{{ item }}</a-select-option>
        </a-select>
        <a-button @click="userStore.testRpcDelay(config.rpc)" type="primary">测试</a-button>
      </div>
    </a-form-item>

    <div class="flex justify-center">
      <a-button type="primary" @click="saveConfig">保存配置</a-button>
    </div>
  </a-form>
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue'
import { reactive, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const config = reactive({
  privateKey: userStore.privateKey,
  rpc: userStore.rpcList[0],
})

const formRef = ref<any>(null)
const saveConfig = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      userStore.setPrivateKey(config.privateKey)
      userStore.setCurrentRpc(config.rpc)
      message.success('保存成功')
    }
  })
}
</script>

<style scoped>
</style>
