<template>
  <a-form :disabled="status.running" class="Bot" ref="formRef" label-position="top" :model="config">
    <a-form-item label="支出的 token 地址" name="poolContract" :required="true">
      <div class="flex">
        <a-select class="w-full" v-model="config.poolContract">
          <a-select-option v-for="item in baseTokens" :value="item.address" :label="item.name"></a-select-option>
        </a-select>
      </div>
    </a-form-item>

    <a-form-item
      :label="`获得的 token 地址${buyTokenPrice ? ` (当前价格：${buyTokenPrice})` : ''
      }`"
      name="buyContract"
      :required="true"
    >
      <div class="flex">
        <a-input v-model="config.buyContract" />
        <async-button :api="approveToken" type="primary" class="ml-10 mr-10">授权</async-button>
        <a-button
          danger
          :loading="status.loopPriceStatus === 'loading'"
          @click="loopTokenPrice"
        >{{ status.loopPriceStatus === 'started' ? '停止' : '轮询' }}</a-button>
      </div>
    </a-form-item>

    <a-form-item class="flex-1" label="买入数量" name="buyAmount" :required="true">
      <a-input-number class="block" v-model="config.buyAmount" :min="1" />
    </a-form-item>

    <div class="flex">
      <a-form-item class="flex-1" label="滑点" name="slippage">
        <a-input-number v-model="config.slippage" :min="1" :max="100" :step="1" step-strictly />
      </a-form-item>

      <a-form-item class="flex-1 ml-10" label="池子规模" name="minPoolSize">
        <a-input-number v-model="config.minPoolSize" :min="0" />
      </a-form-item>
    </div>

    <div class="flex">
      <a-form-item class="flex-1" label="Gas Price (Gwei)" name="gasPrice">
        <a-input-number v-model="config.gasPrice" :min="1" />
      </a-form-item>

      <a-form-item class="flex-1 ml-10" label="Gas Limit" name="gasLimit">
        <a-input-number v-model="config.gasLimit" :min="5" />
      </a-form-item>
    </div>

    <a-form-item>
      <a-button type="primary" class="mr-10" @click="submitForm">开始买入</a-button>
      <a-button class="mr-10" @click="resetForm">重置配置</a-button>
      <a-button @click="tokenListStore.updateEthPrice" :loading="tokenListStore.loading">更新 BNB 价格</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRef } from '@/hooks/useRef'
import { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { getTokenPrice, withPoll } from '@/utils'
import { ROUTER_ADDRESS, WETHTokenAddress } from '@/constants'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { Token } from '@pancakeswap/sdk'
import { Contract } from '@ethersproject/contracts'
import ERC20_ABI from '@/constants/erc20'
import { BigNumber, utils } from 'ethers'
import { useUserStore } from '@/store/user'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useTokensStore } from '@/store/tokens'

interface SwapInfo {
  buyToken: Token | null
  buyContract: Contract | null
  poolContract: Contract | null
}

const userStore = useUserStore()
const tokenListStore = useTokensStore()

/**
 * 购买配置信息
 */
const config = reactive({
  buyAmount: 0,
  poolContract: WBNB_TOKEN.address,
  buyContract: '0x12bb890508c125661e03b09ec06e404bc9289040',
  minPoolSize: 0,
  gasPrice: 7.1,
  gasLimit: 4500000,
  slippage: 10,
})

// const provider = userStore.activeProvider.provider
const { provider, chainId, account } = useActiveProvider()

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
const submitForm = () => {
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

// Token 授权
const approveToken = async () => {
  // await Promise.resolve()
  return checkApproved()
}

// 是否授权
const checkApproved = async () => {
  try {
    const currentAllowance: BigNumber = await swapInfo.buyContract?.allowance(
      account,
      ROUTER_ADDRESS,
    )
    // utils.parseEther(result)
    // return new TokenAmount(swapInfo.buyContract, result.toString())
    console.log(utils.formatEther(currentAllowance))
  } catch (error) {
    console.log(error)
  }
}

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
          config.buyContract,
          WETHTokenAddress,
          provider,
          // priceStore.ethPrice,
        )

        // console.log(`当前价格: ${price}`)
        setBuyTokenPrice(price)

        if (status.loopPriceStatus === 'loading') {
          status.loopPriceStatus = 'started'
        }

        return status.loopPriceEnded
        // return price < 0.063 && price > 0 ? true : undefined
      },
      { interval: 77 },
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
