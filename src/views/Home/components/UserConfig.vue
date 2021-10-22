<template>
  <el-form :model="config" ref="formRef" label-position="top">
    <el-form-item label="私钥" prop="privateKey" :required="true">
      <el-input v-model="config.privateKey" type="password" />
    </el-form-item>

    <el-form-item label="节点" prop="rpc" :required="true">
      <div class="flex w-full items-center">
        <el-select class="flex-1 mr-10" v-model="config.rpc">
          <el-option v-for="item in userStore.rpcList" :key="item" :value="item">
            {{
              item
            }}
          </el-option>
        </el-select>
        <el-button @click="userStore.testRpcDelay(config.rpc)" type="primary">测试</el-button>
      </div>
    </el-form-item>

    <div class="flex justify-center">
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { ElRow, ElCol, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus'
import { reactive, ref } from "vue";
import { useUserStore } from "@/store/user";
import AsyncButton from '@/components/AsyncButton/index.vue';
import useStore from 'element-plus/lib/components/table/src/store';

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
      ElMessage.success("保存成功")
    }
  })
}
</script>

<style scoped></style>