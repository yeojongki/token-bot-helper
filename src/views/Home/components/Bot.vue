<template>
  <el-form
    :disabled="status.running"
    class="Bot"
    ref="formRef"
    label-position="top"
    :model="config"
  >
    <el-form-item label="支出的 token 地址" prop="poolContract" :required="true">
      <div class="flex">
        <el-select class="w-full" v-model="config.poolContract">
          <el-option v-for="item in baseTokens" :value="item.address" :label="item.name"></el-option>
        </el-select>
      </div>
    </el-form-item>

    <el-form-item
      :label="`获得的 token 地址${buyTokenPrice ? ` (当前价格：${buyTokenPrice})` : ''}`"
      prop="buyContract"
      :required="true"
    >
      <div class="flex">
        <el-input v-model="config.buyContract" />
        <async-button :api="approveToken" type="primary" class="ml-10">授权</async-button>
        <el-button
          type="danger"
          :loading="status.loopPriceStatus === 'loading'"
          @click="loopTokenPrice"
        >{{ status.loopPriceStatus === 'started' ? '停止' : '轮询' }}</el-button>
      </div>
    </el-form-item>

    <el-form-item class="flex-1" label="买入数量" prop="buyAmount" :required="true">
      <el-input-number v-model="config.buyAmount" :min="1" />
    </el-form-item>

    <div class="flex">
      <el-form-item class="flex-1" label="滑点" prop="slippage">
        <el-input-number v-model="config.slippage" :min="1" :max="100" :step="1" step-strictly />
      </el-form-item>

      <el-form-item class="flex-1 ml-10" label="池子规模" prop="minPoolSize">
        <el-input-number v-model="config.minPoolSize" :min="0" />
      </el-form-item>
    </div>

    <div class="flex">
      <el-form-item class="flex-1" label="Gas Price (Gwei)" prop="gasPrice">
        <el-input-number v-model="config.gasPrice" :min="1" />
      </el-form-item>

      <el-form-item class="flex-1 ml-10" label="Gas Limit" prop="gasLimit">
        <el-input-number v-model="config.gasLimit" :min="5" />
      </el-form-item>
    </div>

    <el-form-item>
      <el-button type="primary" @click="submitForm">开始买入</el-button>
      <el-button @click="resetForm">重置配置</el-button>
      <el-button @click="tokenListStore.updateEthPrice" :loading="tokenListStore.loading">更新 BNB 价格</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import {
  ElMessage,
  ElForm,
  ElOption,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElButton,
  ElSelect,
  ElRow,
  ElCol,
} from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRef } from '@/hooks/useRef'
import { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { getBlockNumber, getTokenPrice, withPoll } from '@/utils'
import { ROUTER_ADDRESS, WETHTokenAddress } from '@/constants'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { ChainId, Fetcher, Token, TokenAmount, WETH } from '@pancakeswap/sdk'
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
  loopPriceStatus: '' as ('' | 'loading' | 'started'),
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
    const currentAllowance: BigNumber = await swapInfo.buyContract?.allowance(account, ROUTER_ADDRESS)
    // utils.parseEther(result)
    // return new TokenAmount(swapInfo.buyContract, result.toString())
    console.log(utils.formatEther(currentAllowance));
  } catch (error) {
    console.log(error);

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
