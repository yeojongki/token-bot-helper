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
        <el-option v-for="item in RPCList" :key="item" :value="item">{{
          item
        }}</el-option>
      </el-select>

      <el-button type="primary">更改并测试</el-button>
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
      <el-button @click="loopTokenPrice" :loading="status.loopPriceLoading"
        >当前 token 实时价格</el-button
      >
      <el-button @click="updateWBNBPrice" :loading="status.updateWBNBLoading"
        >更新WBNB价格</el-button
      >
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from '@vue/reactivity'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useRef } from '@/hooks/useRef'
import { USDT_TOKEN } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { WETHTokenAddress } from '@/constants'

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
  buyContract: '0x12bb890508c125661e03b09ec06e404bc9289040',
  minPoolSize: 0,
  gasPrice: 7.1,
  gasLimit: 4500000,
  slippage: 10,
})

const { provider } = useActiveProvider(config.rpc)

const status = reactive({
  running: false,
  loopPriceLoading: false,
  updateWBNBLoading: false,
})

// 初始化 WETH(WBNB) 价格
const [WETH_PRICE, SET_WETH_PRICE] = useRef(400)
const updateWBNBPrice = async () => {
  try {
    status.updateWBNBLoading = true
    const price = await getTokenPrice(
      WETHTokenAddress,
      USDT_TOKEN.address,
      provider,
      WETH_PRICE.value,
    )

    // TODO message
    SET_WETH_PRICE(price)
  } catch (error) {
    console.error('update eth price error', error)
  } finally {
    status.updateWBNBLoading = false
  }
}

updateWBNBPrice()

const formRef = ref<any>(null)
const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 设置正在运行
      status.running = true

      console.log(await provider.getBlockNumber())
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const loopTokenPrice = async () => {
  status.loopPriceLoading = true
  console.log(`WBNB当前价格为: ${WETH_PRICE.value}`)

  try {
    await withPoll(
      async () => {
        const price = await getTokenPrice(
          config.buyContract,
          WETHTokenAddress,
          provider,
          WETH_PRICE.value,
        )
        console.log(`当前价格为: ${price}`)
        return undefined
        // return price < 0.063 && price > 0 ? true : undefined
      },
      { interval: 100 },
    )
  } finally {
    status.loopPriceLoading = false
  }
}
</script>

<style lang="scss" scoped>
.home {
  width: 600px;
  margin: 20px auto;
}
</style>
