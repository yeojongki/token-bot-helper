<template>
  <el-form
    :disabled="status.running"
    class="home"
    ref="formRef"
    label-position="right"
    label-width="160px"
    :model="config"
  >
    <el-form-item label="私钥" prop="privateKey">
      <el-input v-model="config.privateKey" type="password" />
    </el-form-item>

    <el-form-item label="节点" prop="rpc">
      <el-select v-model="config.rpc">
        <el-option v-for="item in RPCList" :key="item" :value="item">{{ item }}</el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="池子规模" prop="minPoolSize">
      <el-input-number v-model="config.minPoolSize" />
    </el-form-item>

    <el-form-item label="目标合约地址" prop="buyContract">
      <el-input v-model="config.buyContract" />
    </el-form-item>

    <el-form-item label="支付数量" prop="buyAmount">
      <el-input-number v-model="config.buyAmount" />
    </el-form-item>

    <el-form-item label="滑点" prop="slippage">
      <el-input-number v-model="config.slippage" :step="1" step-strictly />
    </el-form-item>

    <el-form-item label="Gas price (gwei)" prop="gasPrice">
      <el-input-number v-model="config.gasPrice" />
    </el-form-item>

    <el-form-item label="Gas Limit" prop="gasLimit">
      <el-input-number v-model="config.gasLimit" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">开始</el-button>
      <el-button @click="resetForm">重置配置</el-button>
      <el-button @click="getTokenPrice">实时价格</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { usePair } from '@/hooks/usePairs'
import { reactive, ref } from '@vue/reactivity'
import { Fetcher } from '@pancakeswap/sdk'
import { useActiveProvider } from '@/hooks/useActiveProvider'


// RPC 列表
const RPCList = [
  // 'https://apis.ankr.com/e432c839f39842128925c77c3fe3d648/36016d356ed82e236d76d9b7709e8342/binance/full/main',
  import.meta.env.VITE_RPC_NODE,
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
]

const config = reactive({
  privateKey: import.meta.env.VITE_PRIVATE_KEY,
  rpc: RPCList[0],
  buyAmount: 0,
  buyContract: "",
  minPoolSize: 0,
  gasPrice: 7.1,
  gasLimit: 4500000,
  slippage: 10,
})

const provider = useActiveProvider(config.rpc)

const status = reactive({
  running: false,
})

const formRef = ref<any>(null)
const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 设置正在运行
      status.running = true

      console.log(
        await provider.getBlockNumber()
      );
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const getTokenPrice = async () => {

}

</script>

<style lang="scss" scoped>
.home {
  width: 600px;
  margin: 20px auto;
}
</style>
