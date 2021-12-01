<template>
  <a-form :disabled="status.running" class="Bot" ref="formRef" :model="config">
    <a-form-item label="支出 token 地址" name="poolContract" :required="true">
      <div class="flex">
        <a-select class="w-full" v-model:value="config.poolContract">
          <a-select-option v-for="item in baseTokens" :value="item.address">{{
            item.name
          }}</a-select-option>
        </a-select>
        <async-button :api="approveInputToken" type="primary" class="ml-10"
          >授权</async-button
        >
      </div>
    </a-form-item>

    <a-form-item
      :label="`获得 token 地址${
        buyTokenPrice ? ` (当前价格：${buyTokenPrice})` : ''
      }`"
      name="buyContract"
      :required="true"
    >
      <div class="flex">
        <a-input v-model:value="config.buyContract" />
        <async-button
          :api="approveOutputToken"
          type="primary"
          class="ml-10 mr-10"
          >授权</async-button
        >
        <a-button
          danger
          :loading="status.loopPriceStatus === 'loading'"
          @click="loopTokenPrice"
          >{{
            status.loopPriceStatus === 'started' ? '停止' : '轮询'
          }}</a-button
        >
      </div>
    </a-form-item>

    <a-form-item
      class="flex-1"
      label="买入数量"
      name="buyAmount"
      :required="true"
    >
      <a-input-number class="block" v-model:value="config.buyAmount" :min="1" />
    </a-form-item>

    <div class="flex">
      <a-form-item class="flex-1" label="滑点" name="slippage">
        <a-input-number
          v-model:value="config.slippage"
          :min="1"
          :max="100"
          :step="1"
          step-strictly
        />
      </a-form-item>

      <a-form-item class="flex-1 ml-10" label="池子规模" name="minPoolSize">
        <a-input-number v-model:value="config.minPoolSize" :min="0" />
      </a-form-item>
    </div>

    <div class="flex">
      <a-form-item class="flex-1" label="Gas Price (Gwei)" name="gasPrice">
        <a-input-number v-model:value="config.gasPrice" :min="1" />
      </a-form-item>

      <a-form-item class="flex-1 ml-10" label="Gas Limit" name="gasLimit">
        <a-input-number v-model:value="config.gasLimit" :min="70000" />
      </a-form-item>
    </div>

    <a-form-item>
      <a-button type="primary" class="mr-10" @click="startBuying"
        >开始买入</a-button
      >
      <a-button class="mr-10" @click="resetForm">重置配置</a-button>
      <a-button
        @click="tokensStore.updateEthPrice"
        :loading="tokensStore.loading"
        >更新 BNB 价格</a-button
      >
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRef } from '@/hooks/useRef'
import { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { PoolType, ROUTER_ADDRESS } from '@/constants'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { Token } from '@pancakeswap/sdk'
import { Contract } from '@ethersproject/contracts'
import ERC20_ABI from '@/constants/erc20'
import { BigNumber, utils } from 'ethers'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useTokensStore } from '@/store/tokens'
import { useRouteQuery } from '@/hooks/useURLQuery'

interface SwapInfo {
  buyToken: Token | null
  buyContract: Contract | null
  poolContract: Contract | null
}

const tokensStore = useTokensStore()
const {
  buyAmount = 0,
  inputCurrency = WBNB_TOKEN.address,
  outputCurrency = '0x12bb890508c125661e03b09ec06e404bc9289040',
  gasPrice = 7,
  gasLimit = 4500000,
  slippage = 10,
  minPoolSize = 0,
} = useRouteQuery()

/**
 * 购买配置信息
 */
const config = reactive({
  buyAmount,
  poolContract: inputCurrency,
  buyContract: outputCurrency,
  gasPrice,
  gasLimit,
  slippage,
  minPoolSize,
})

// const provider = userStore.activeProvider.provider
const { provider, account } = useActiveProvider()

const swapInfo = reactive<SwapInfo>({
  buyContract: new Contract(config.buyContract, ERC20_ABI, provider),
  poolContract: new Contract(config.poolContract, ERC20_ABI, provider),
  buyToken: null,
  // pancakeRoute: new Contract(
  //   ROUTER_ADDRESS,
  //   PANCAKE_ROUTE_ABI,
  //   wallet,
  // )
})

onMounted(async () => {
  // const start = +new Date()
  // const token: Token = await Fetcher.fetchTokenData(ChainId.MAINNET, config.buyContract, provider);
  // const pair = await Fetcher.fetchPairData(token, WETH[token.chainId], provider);
  // const end = +new Date()-start
  // console.log({end,token,pair});
  // withPoll(async () => {
  //   const block = await provider.getBlock('latest')
  //   if (block && block.transactions.length) {
  //     for (let txHash of block.transactions) {
  //       let tx = await provider.getTransaction(txHash)
  //       console.log(tx);
  //     }
  //   }
  //   return undefined
  // }, { interval: 100 })
})

const status = reactive({
  running: false,
  loopPriceStatus: '' as '' | 'loading' | 'started',
  loopPriceEnded: false,
})

// 初始基础代币
const baseTokens = [WBNB_TOKEN, BUSD_TOKEN, USDT_TOKEN]

const [buyTokenPrice, setBuyTokenPrice] = useRef(0)

const formRef = ref<any>(null)

/**
 * TODO 开始买入
 */
const startBuying = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 设置正在运行
      status.running = true
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

/**
 * 检查授权数量
 */
const checkAllowance = async (contract: Contract | null) => {
  try {
    if (!contract) {
      return Promise.reject('contract is null')
    } else {
      const currentAllowance: BigNumber = await contract.allowance(
        account,
        ROUTER_ADDRESS,
      )
      // utils.parseEther(result)
      // return new TokenAmount(swapInfo.buyContract, result.toString())
      console.log(utils.formatEther(currentAllowance))
    }
  } catch (error) {
    console.log(error)
  }
}

/**
 * 花费的 token 授权
 */
const approveInputToken = async () =>
  checkAllowance(swapInfo.poolContract as Contract)

/**
 * 获得的 token 授权
 */
const approveOutputToken = async () =>
  checkAllowance(swapInfo.buyContract as Contract)

// 轮询当前购买的 token 价格
const loopTokenPrice = async () => {
  if (status.loopPriceStatus === 'started') {
    status.loopPriceStatus = ''
    status.loopPriceEnded = true
    return
  }

  status.loopPriceStatus = 'loading'

  try {
    await withPoll(
      async () => {
        const price = await getTokenPrice(
          config.poolContract === WBNB_TOKEN.address
            ? PoolType.BNB
            : config.poolContract === BUSD_TOKEN.address
            ? PoolType.BUSD
            : config.poolContract === USDT_TOKEN.address
            ? PoolType.USDT
            : PoolType.UNKNOWN,
          config.buyContract,
          provider,
        )

        setBuyTokenPrice(
          config.poolContract === WBNB_TOKEN.address
            ? price * tokensStore.ethPrice
            : price,
        )

        if (status.loopPriceStatus === 'loading') {
          status.loopPriceStatus = 'started'
        }

        return status.loopPriceEnded
        // return price < 0.063 && price > 0 ? true : undefined
      },
      { interval: 100 },
    )
  } finally {
    status.loopPriceStatus = 'started'
  }
}
</script>

<style lang="scss" scoped>
.Bot {
  margin: 0 auto;
}
</style>
