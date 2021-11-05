<template>
  <Form :model="config" ref="formRef" label-position="top">
    <FormItem label="私钥" name="privateKey" :required="true">
      <Input v-model="config.privateKey" type="password" />
    </FormItem>

    <FormItem label="节点" name="rpc" :required="true">
      <div class="flex w-full items-center">
        <Select class="flex-1 mr-10" v-model="config.rpc">
          <SelectOption
            v-for="item in userStore.rpcList"
            :key="item"
            :value="item"
          >
            {{ item }}
          </SelectOption>
        </Select>
        <Button @click="userStore.testRpcDelay(config.rpc)" type="primary"
          >测试</Button
        >
      </div>
    </FormItem>

    <div class="flex justify-center">
      <Button type="primary" @click="saveConfig">保存配置</Button>
    </div>
  </Form>
</template>

<script lang="ts" setup>
import {
  Form,
  FormItem,
  Select,
  SelectOption,
  Button,
  Input,
  message,
} from 'ant-design-vue'
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

<style scoped></style>
