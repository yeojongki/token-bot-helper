<template>
  <div class="p-15">
    <!-- 游戏背包资产表格 -->
    <a-table
      :scroll="{ x: 'max-content' }"
      class="mb-20"
      row-key="id"
      :loading="gameAssets.loading"
      :bordered="true"
      :columns="gameAssets.columns"
      :pagination="false"
      :data-source="gameAssets.list"
    >
      <template #title>
        <div class="flex justify-between">
          <span class="font-bold">游戏背包资产</span>
          <div>uRACA授权数量: {{ tokenBalance.uRACAAllowance }}</div>
        </div>
      </template>
    </a-table>

    <!-- 钱包资产表格 -->
    <a-table
      :scroll="{ x: 'max-content' }"
      class="mb-20"
      row-key="id"
      :loading="walletAssets.loading"
      :bordered="true"
      :pagination="false"
      :data-source="walletAssets.assets"
      :columns="walletAssets.columns"
    >
      <template #title>
        <div class="flex justify-between">
          <div class="flex">
            <div class="font-bold mr-10">钱包资产:</div>
            <div
              @click="onWalletAssetChange(address.METAMON_EGG_ADDRESS)"
              :class="{
                'nav-item': true,
                'is-active':
                  walletAssets.activeAsset === address.METAMON_EGG_ADDRESS,
              }"
            >
              蛋
            </div>
            <div
              @click="onWalletAssetChange(address.N_METAMON_ADDRESS)"
              :class="{
                'nav-item': true,
                'is-active':
                  walletAssets.activeAsset === address.N_METAMON_ADDRESS,
              }"
            >
              N元兽
            </div>
            <div
              @click="onWalletAssetChange(address.Potion_ADDRESS)"
              :class="{
                'nav-item': true,
                'is-active':
                  walletAssets.activeAsset === address.Potion_ADDRESS,
              }"
            >
              药水
            </div>
          </div>

          <div class="flex items-center">
            <div class="mr-10">RACA: {{ tokenBalance.raca }}</div>
          </div>
        </div>
      </template>
    </a-table>

    <!-- 提现/充值到游戏弹窗 -->
    <a-modal
      :title="`${
        currentTradeInfo.type === 'deposit' ? '充值' : '提现'
      }到游戏中`"
      @ok="depositOrWithdraw"
      :ok-button-props="{ loading: walletAssets.submitLoading }"
      v-model:visible="currentTradeInfo.modalVisible"
    >
      <a-form>
        <a-form-item label="名称">{{ currentTradeInfo.name }}</a-form-item>
        <a-form-item name="count" label="数量">
          <a-input-number
            :min="1"
            :max="currentTradeInfo.count"
            v-model:value="currentTradeInfo.count"
          ></a-input-number>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 上架到交易市场弹窗 -->
    <a-modal
      title="上架到交易市场"
      @ok="handleShelf"
      :ok-button-props="{ loading: shelfInfo.submitLoading }"
      v-model:visible="shelfInfo.modalVisible"
    >
      <a-form>
        <a-form-item label="名称">{{ shelfInfo.name }}</a-form-item>
        <a-form-item label="数量">
          <a-input-number
            :step="1"
            :min="1"
            :max="shelfInfo.count"
            v-model:value="shelfInfo.count"
          ></a-input-number>
        </a-form-item>
        <a-form-item label="价格(RACA)">
          <a-input-number
            :step="1"
            :min="1"
            :max="shelfInfo.price"
            v-model:value="shelfInfo.price"
          ></a-input-number>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 我的元兽列表 -->
    <a-table
      :scroll="{ x: 'max-content' }"
      class="mb-20"
      row-key="id"
      :loading="myMonsters.loading"
      :bordered="true"
      :pagination="false"
      :data-source="myMonsters.list"
      :columns="monsterColumns"
    >
      <template #title>
        <span class="font-bold mr-10">我的元兽</span>
      </template>
    </a-table>

    <!-- 对战元兽列表 -->
    <!-- <a-table
    :scroll="{ x: 'max-content' }"
      row-key="id"
      :loading="battleList.loading"
      :bordered="true"
      :pagination="false"
      :data-source="battleList.list"
      :columns="battleListColumns"
    >
      <template #title>
        <span class="font-bold">对战元兽</span>
      </template>
    </a-table> -->
  </div>
</template>

<script setup lang="tsx">
import { formPost } from './request'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useRef } from '@/hooks/useRef'
import { RACA_SIGN_KEY, RACA_TOKEN_KEY } from '@/constants/storageKey'
import { Button, message, notification } from 'ant-design-vue'
import { Contract, utils } from 'ethers'
import NFTABI from './abi/nft'
import fixPriceSellABI from './abi/fixPriceSell'
import fungibleTokenABI from './abi/fungibleToken'
import metamonWalletABI from './abi/metamonWallet'
import {
  address,
  assetAddressMap,
  formatGameAssetNameByType,
  formatWalletAssetNameByType,
  GameAsset,
  gameAssetPayTypeMap,
  getMinimumIdFormList,
  Monster,
  RequestResultCode,
  WalletAsset,
} from './common'
import { computed, reactive } from 'vue'
import { execWithSleep, withPoll } from '@/utils'
import ERC20_ABI from '@/constants/erc20'

const { account, wallet } = useActiveProvider()

/**
 * 用到的合约
 */
const contracts = {
  [address.RACA_ADDRESS]: new Contract(address.RACA_ADDRESS, ERC20_ABI, wallet),
  [address.METAMON_EGG_ADDRESS]: new Contract(
    address.METAMON_EGG_ADDRESS,
    NFTABI,
    wallet,
  ),
  [address.Potion_ADDRESS]: new Contract(
    address.Potion_ADDRESS,
    NFTABI,
    wallet,
  ),
  [address.FIX_PRICE_SELL_ADDRESS]: new Contract(
    address.FIX_PRICE_SELL_ADDRESS,
    fixPriceSellABI,
    wallet,
  ),
  [address.fungibleTokenBundle]: new Contract(
    address.fungibleTokenBundle,
    fungibleTokenABI,
    wallet,
  ),
}

const [sign, setSign] = useRef(localStorage.getItem(RACA_SIGN_KEY) || '')
const [token, setToken] = useRef(localStorage.getItem(RACA_TOKEN_KEY) || '')

/**
 * 余额
 */
const tokenBalance = reactive({
  raca: 0,
  uRACAAllowance: 0,
})

/**
 * 上架信息
 */
const shelfInfo = reactive({
  modalVisible: false,
  submitLoading: false,
  name: '',
  count: 0,
  price: 30000,
  payType: -100,
})

/**
 * 钱包资产数据
 */
const walletAssets = reactive({
  assets: [] as WalletAsset[],
  loading: false,
  submitLoading: false,
  activeAsset: address.METAMON_EGG_ADDRESS,
  columns: [
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '数量',
      dataIndex: 'count',
    },
    // {
    //   title: 'tokenId',
    //   dataIndex: 'token_id',
    // },
    // {
    //   title: 'nft 地址',
    //   dataIndex: 'nft_address',
    // },
    {
      title: '操作',
      dataIndex: 'action',
      customRender({ record }: { record: WalletAsset }) {
        return (
          <>
            <Button type="link" onClick={() => onShelf(record)}>
              上架
            </Button>
            <Button type="link" onClick={() => onDeposit(record)}>
              充值
            </Button>
          </>
        )
      },
    },
  ],
})

/**
 * 我的当前元兽
 */
const myMonsters = reactive({
  list: [] as Monster[],
  currentId: -1,
  loading: false,
})

/**
 * 元兽对战表格列
 */
const monsterColumns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '等级',
    dataIndex: 'level',
  },
  {
    title: '次数',
    dataIndex: 'tear',
  },
  {
    title: '经验',
    dataIndex: 'exp',
  },
  {
    title: '升级所需经验',
    dataIndex: 'expMax',
  },
  {
    title: '能否升级',
    dataIndex: 'monsterUpdate',
    customRender({ record }: any) {
      return record.exp > record.expMax ? '✅' : '❌'
    },
  },
  {
    title: '品质',
    dataIndex: 'rarity',
  },
  {
    title: '总属性',
    dataIndex: 'sca',
  },
  {
    title: '图片',
    dataIndex: 'imageUrl',
    customRender({ text }: any) {
      return <img class="item-img" width="80" height="80" src={text} />
    },
  },
  {
    title: '操作',
    dataIndex: 'action',
    customRender({ record }: { record: Monster }) {
      // <Button type="link" onClick={() => setBattleMetamon(record.id)}>
      //     设为战斗
      //   </Button>
      return (
        <>
          <Button
            type="link"
            disabled={!canBatchFightAll.value}
            onClick={() => batchFightAll(record.id, record.tear)}
          >
            战斗所有次数
          </Button>
          <Button
            type="link"
            disabled={!canUpgrade.value}
            onClick={() => updateMonster(record.id)}
          >
            升级
          </Button>
        </>
      )
    },
  },
]

/**
 * 元兽对战列表信息
 */
const battleList = reactive({
  loading: false,
  list: [] as Monster[],
  column: monsterColumns.concat([
    {
      title: '操作',
      dataIndex: 'action',
      customRender({ record }: { record: Monster }) {
        return (
          <Button type="primary" onClick={() => fight(record.id, true)}>
            battle
          </Button>
        )
      },
    },
  ]),
})

/**
 * 游戏背包资产
 */
const gameAssets = reactive({
  loading: false,
  list: [] as GameAsset[],
  columns: [
    {
      title: 'id ',
      dataIndex: 'id',
    },
    {
      title: '名称',
      dataIndex: 'bpType',
      customRender({ record }: { record: GameAsset }) {
        return formatGameAssetNameByType(record.bpType)
      },
    },
    {
      title: '数量',
      dataIndex: 'bpNum',
    },
    {
      title: '操作',
      dataIndex: 'action',
      customRender({ record }: { record: GameAsset }) {
        const { bpType, bpNum } = record
        // 元兽蛋碎片
        if (bpType === 1) {
          return (
            <Button
              type="primary"
              disabled={!canComposeMetamonEgg.value}
              onClick={composeMonsterEgg}
            >
              合成
            </Button>
          )
        }

        // 元兽蛋
        if (bpType === 6) {
          return (
            <Button
              type="primary"
              disabled={bpNum <= 0}
              onClick={() => onWithdraw(record, -5)}
            >
              提现
            </Button>
          )
        }

        // uRACA
        if (bpType === 5) {
          return (
            <>
              <Button
                type="primary"
                disabled={tokenBalance.raca <= 0}
                onClick={onRechargeURACA}
              >
                充值
              </Button>
              <Button type="primary" class="ml-10" onClick={approveURACA}>
                授权
              </Button>
            </>
          )
        }

        return ''
      },
    },
  ],
})

/**
 * 能否战斗所有次数
 */
const canBatchFightAll = computed(() => {
  const uRaca = gameAssets.list.find(item => item.bpType === 5)
  if (uRaca && uRaca.bpNum >= 1000) {
    return true
  }

  return false
})

/**
 * 能否升级
 */
const canUpgrade = computed(() => {
  const postion = gameAssets.list.find(item => item.bpType === 2)
  if (postion && postion.bpNum >= 1) {
    return true
  }

  return false
})

/**
 * 是否能合成蛋
 */
const canComposeMetamonEgg = computed(() => {
  const eggFragments = gameAssets.list.find(item => item.bpType === 1)
  if (eggFragments && eggFragments.bpNum >= 1000) {
    return true
  }

  return false
})

/**
 * 当前钱包资产数据
 */
const currentTradeInfo = reactive({
  modalVisible: false,
  /**
   * 数量
   */
  count: 1,
  tokenIds: '',
  payType: -100,
  rartity: 1,
  name: '',
  /**
   * 类型 充值或提现
   */
  type: 'deposit' as 'deposit' | 'withdraw',
})

/**
 * 对战表格列
 */
const battleListColumns = monsterColumns.concat([
  {
    title: '操作',
    dataIndex: 'action',
    customRender({ record }: { record: Monster }) {
      return (
        <Button type="primary" onClick={() => fight(record.id, true)}>
          battle
        </Button>
      )
    },
  },
])

/**
 * 登录
 */
const login = async () => {
  // 读缓存中的
  if (token.value && sign.value) {
    return true
  }

  // 走网络请求
  const signMessage = 'LogIn'
  const msgKey = 'login'
  message.loading({
    key: msgKey,
    duration: 0,
    content: '正在登录中',
  })
  if (!sign.value) {
    const res = await wallet.signMessage(signMessage)
    // 保存 sign key
    setSign(res)
    localStorage.setItem(RACA_SIGN_KEY, res)
  }

  const { code, data } = await formPost<{
    code: RequestResultCode
    data: string
  }>('/metamon/login', {
    address: account,
    sign: sign.value,
    msg: signMessage,
  })

  if (code === 'SUCCESS') {
    // 保存 token
    setToken(data)
    localStorage.setItem(RACA_TOKEN_KEY, data)

    message.success({
      key: msgKey,
      duration: 1,
      content: '登录成功',
    })
  } else {
    notification.error({
      message: '登录失败',
    })
  }
}

/**
 * 获取游戏资产
 */
const getGameAssets = async () => {
  try {
    gameAssets.loading = true
    const { code, data } = await formPost<{
      code: RequestResultCode
      data: { item: GameAsset[] }
    }>('/metamon/checkBag', {
      address: account,
    })

    if (code === 'SUCCESS') {
      gameAssets.list = (data.item || []).filter(item => item.bpNum > 0)
    } else {
      notification.error({
        message: '获取游戏资产失败',
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    gameAssets.loading = false
  }
}

/**
 * 获取我的元兽列表
 */
const getSelfMonster = async () => {
  try {
    myMonsters.loading = true
    const {
      code,
      data: { metamonList },
    } = await formPost<{
      code: RequestResultCode
      data: { metamonList: Monster[] }
    }>('/metamon/getWalletPropertyList', {
      pageSize: 9999,
      page: 1,
      address: account,
    })

    if (code === 'SUCCESS') {
      metamonList && (myMonsters.list = metamonList)
    } else {
      notification.error({
        message: '获取我的元兽失败',
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    myMonsters.loading = false
  }
}

/**
 * 获取对战列表
 */
const getBattleList = async () => {
  try {
    battleList.loading = true

    const { code, data } = await formPost<{
      code: RequestResultCode
      data: { number: number; objects: Monster[] }
    }>('/metamon/getBattelObjects', {
      address: account,
      metamonId: myMonsters.currentId,
      front: 1,
    })
    if (code === 'SUCCESS') {
      battleList.list = data.objects
    } else {
      notification.error({
        message: '获取对战列表失败',
      })
    }
  } finally {
    battleList.loading = false
  }
}

/**
 * 对战前支付 raca
 */
const startPay = async (monsterB: number) => {
  const { code, data } = await formPost<{
    code: RequestResultCode
    data: { amount: number; pay: boolean }
  }>('/metamon/startPay', {
    monsterA: myMonsters.currentId,
    monsterB,
    address: account,
    battleLevel: 1,
  })

  if (code === 'SUCCESS' && data.pay) {
    return true
  } else {
    throw new Error('支付失败')
  }
}

/**
 * 元兽对战
 */
const fight = async (monsterB: number, showMessage = true) => {
  await startPay(monsterB)

  const { code, data } = await formPost<{
    code: RequestResultCode
    data: { challengeResult: boolean }
  }>('/metamon/startBattle', {
    monsterA: myMonsters.currentId,
    monsterB,
    address: account,
    battleLevel: 1,
  })
  if (code === 'SUCCESS') {
    if (showMessage) {
      if (data.challengeResult) {
        message.success({
          duration: 1.5,
          content: '胜利',
        })
      } else {
        message.error({
          duration: 1.5,
          content: '失败',
        })
      }
    }

    return data.challengeResult ? 1 : 0
  } else {
    notification.error({
      message: '对战失败',
    })
    return 0
  }
}

/**
 * 元兽升级
 */
const updateMonster = async (nftId: number) => {
  const { code } = await formPost<{
    code: RequestResultCode
  }>('/metamon/updateMonster', {
    nftId,
    address: account,
  })
  if (code === 'SUCCESS') {
    message.success({
      duration: 1.5,
      content: '升级成功',
    })

    // 刷新列表
    getBattleList()
  } else {
    notification.error({
      message: '升级失败',
    })
  }
}

/**
 * 获取钱包资产
 */
const getWalletAssets = async () => {
  try {
    // const base64Data = await contracts[address.fungibleTokenBundle].tokensOf(
    //   wallet.address,
    // )
    // const assets: WalletAsset[] = JSON.parse(
    //   window.atob(base64Data.substr(29)),
    // ).tokens
    walletAssets.loading = true

    const assetContract = contracts[walletAssets.activeAsset]

    if (!assetContract) {
      notification.error({
        message: `合约 【${walletAssets.activeAsset}】未实现`,
      })
      return
    }

    const count = Number(await assetContract.balanceOf(wallet.address, 0))
    const payType = gameAssetPayTypeMap[walletAssets.activeAsset]

    if (!payType) {
      notification.error({
        message: `payType【${walletAssets.activeAsset}】未实现`,
      })
      return
    }

    walletAssets.assets = [
      {
        name: assetAddressMap[walletAssets.activeAsset],
        count,
        address: walletAssets.activeAsset,
        payType,
      },
    ]

    // contracts[address.METAMON_EGG_ADDRESS]
    //   .balanceOf(wallet.address, 0)
    //   .then((count: number) => {
    //     console.log({ count })
    //   })

    // const { code, list } = await get(
    //   'https://market-api.radiocaca.com/artworks',
    //   {
    //     pageNo: 1,
    //     pageSize: 100,
    //     address: account,
    //     status: 'not_on_sale',
    //   },
    // )
    // if (code === 200) {
    //   setWalletAssets(list)
    // } else {
    //   notification.error({
    //     message: '获取钱包资产失败',
    //   })
    // }
  } catch (error) {
    console.error(error)
    notification.error({
      message: error,
    })
  } finally {
    walletAssets.loading = false
  }
}

/**
 * 上架
 */
const handleShelf = async () => {
  try {
    shelfInfo.submitLoading = true

    const { payType, count, price } = shelfInfo
    let nftAddress = ''
    let tokenId = ''

    if (payType === 5) {
      tokenId = '0'
      nftAddress = address.METAMON_EGG_ADDRESS
    }

    if (!tokenId || !nftAddress) {
      notification.error({
        message: `TODO ${formatWalletAssetNameByType(payType)}上架未实现`,
      })
    }

    const tx = await contracts[address.FIX_PRICE_SELL_ADDRESS].sell(
      nftAddress,
      `${tokenId}`,
      `${count}`,
      address.RACA_ADDRESS,
      utils.parseEther(`${price * count}`),
      0,
      0,
    )

    await tx.wait()
  } catch (error) {
    console.error(error)
  } finally {
    shelfInfo.submitLoading = false
  }
}

/**
 * 上架前处理
 */
const onShelf = async (item: WalletAsset) => {
  Object.assign(shelfInfo, item)
  shelfInfo.name = formatWalletAssetNameByType(item.payType) || '未知'
  shelfInfo.modalVisible = true
}

/**
 * 充值到游戏资产
 */
const onDeposit = (item: WalletAsset) => {
  Object.assign(currentTradeInfo, item)
  currentTradeInfo.type = 'deposit'
  currentTradeInfo.modalVisible = true
}

/**
 * 提现到钱包资产
 */
const onWithdraw = (item: GameAsset, payType: number) => {
  Object.assign(currentTradeInfo, item)
  currentTradeInfo.name = formatGameAssetNameByType(item.bpType)
  currentTradeInfo.payType = payType
  currentTradeInfo.type = 'withdraw'
  currentTradeInfo.modalVisible = true
}

/**
 * 检查钱包充值游戏订单状态
 */
const checkDepositOrderStatus = async (txHash: string) => {
  const {
    code,
    data: { status },
  } = await formPost<{
    code: RequestResultCode
    data: { status: boolean }
  }>('/metamon/orderStatus', {
    address: wallet.address,
    txHash,
  })

  if (code === 'SUCCESS' && status) {
    return undefined
  }

  return true
}

// {
//     "data": [],
//     "messages": "0x2778eed812e678c1eb79e01c1a0a32d3aa8ddb460da96185b666e890649aa210",
//     "num": null,
//     "orderId": "1469610253066701568",
//     "signatures": "0xd3cea669db38ea94c81622e92f6fe077f130a631efad6336330d58bc52e11a247d9d68f00312219555521b2c40aec0f93c55a46b0fcc47fe0ca42646b77233301c"
// }

/**
 * 获取交易订单信息
 */
const _getTradeOrder = async () => {
  try {
    const {
      payType,
      count,
      tokenIds = '',
      rartity = 1,
      type,
    } = currentTradeInfo

    const body = {
      payType,
      tokenIds,
      num: count,
      rartity,
      address: account,
    }

    const { code, data } = await formPost<{
      code: RequestResultCode
      data: any
    }>(
      `/metamon/${
        type === 'deposit' ? 'transferInBySymbol' : 'transferOutBySymbol'
      }`,
      body,
    )

    return {
      code,
      data,
    }
  } catch (error) {
    notification.error({
      message: `${currentTradeInfo.type === 'deposit' ? '充值' : '提现'}失败`,
    })
    return {}
  }
}

/**
 * 充值或提现资产
 */
const depositOrWithdraw = async () => {
  walletAssets.submitLoading = true
  const { payType, count, tokenIds = '', rartity = 1, type } = currentTradeInfo
  // 提现 or 充值
  const isDeposit = type === 'deposit'
  const typeText = isDeposit ? '充值' : '提现'

  // 提现返回
  // {
  //     "code": "SUCCESS",
  //     "data": {
  //         "data": [],
  //         "messages": "0x7c32bfd77f3affd7b5015045e574c80b794e06d556235e6a764ddd2258922b78",
  //         "num": null,
  //         "orderId": "1469564480438405376",
  //         "signatures": "0x30b45c744c0d42a322fecdd1ccfe96b9983a8c1cff62e0862779c65eb45f623305313858baba471419b195089b45fd0909979e73cc4e9949759006a351c9f0081b"
  //     },
  //     "message": "",
  //     "result": 1
  // }
  const { data } = await _getTradeOrder()
  const orderId = isDeposit ? data : data.orderId
  const signatures = isDeposit ? undefined : data.signatures
  const messages = isDeposit ? undefined : data.messages

  if (!orderId) {
    notification.error({
      message: `orderId 获取失败`,
    })
    return
  }

  try {
    const contract = new Contract(
      isDeposit ? address.METAMON_WALLET : address.METAMON_WALLET_V2,
      metamonWalletABI,
      wallet,
    )

    let tx: any = null
    const gas = {
      gasLimit: 60000,
      gasPrice: utils.parseUnits(`6`, 'gwei'),
    }

    // TODO 其他类型
    switch (payType) {
      // 药水
      case 2:
        tx = await contract.deposit1155(
          address.Potion_ADDRESS,
          0,
          count,
          orderId,
          // gas,
        )
        break

      case 1:
        tx = await contract.depositRACA(
          utils.parseUnits(count + ''),
          orderId,
          // gas,
        )
        break

      case -5:
        tx = await contract.withdraw1155(
          address.METAMON_EGG_ADDRESS,
          0,
          count,
          messages,
          signatures,
          orderId,
          // gas,
        )

        break

      default:
        // TODO 完善其他类型充值
        notification.error({
          message: `${payType} 类型${typeText}暂未实现`,
        })
        break
    }

    if (tx) {
      await tx.wait()
      await withPoll(async () => await checkDepositOrderStatus(tx.hash))

      notification.success({
        message: `${typeText}成功`,
      })

      // 弹窗关闭
      currentTradeInfo.modalVisible = false
      // 刷新列表
      getWalletAssets()
      getGameAssets()
    }
  } catch (error) {
    console.error(error)

    // 取消订单
    if (!isDeposit) {
      cancelWithdrawOrder(orderId, messages)
    }
  } finally {
    walletAssets.submitLoading = false
  }
}

/**
 * 取消提现订单
 */
const cancelWithdrawOrder = async (orderId: string, hash: string) => {
  try {
    const { code } = await formPost<{ code: RequestResultCode }>(
      '/metamon/transferOutCancel',
      {
        address: wallet.address,
        orderId,
        hash,
      },
    )

    if (code !== 'SUCCESS') {
      const msg = '取消订单失败'
      notification.error({
        message: msg,
      })
      console.error(msg)
      console.error({ orderId, hash })
    }
  } catch (error) {}
}

/**
 * 碎片合成元兽蛋
 */
const composeMonsterEgg = async () => {
  try {
    gameAssets.loading = true
    const { code } = await formPost<{
      code: RequestResultCode
    }>('/metamon/composeMonsterEgg', {
      address: account,
    })

    if (code === 'SUCCESS') {
      message.success({
        duration: 1.5,
        content: '成功',
      })

      // 刷新列表
      getGameAssets()
    }
  } catch (error) {
    console.error(error)
  } finally {
    gameAssets.loading = false
  }
}

/**
 * 战斗所有次数
 */
const batchFightAll = async (metamonId: number, tear: number) => {
  try {
    myMonsters.loading = true

    await setBattleMetamon(metamonId, false)

    // 对战列表中最低属性元兽 id
    const minimumId = getMinimumIdFormList(battleList.list)

    const datas = await Promise.all(
      Array.from(Array(tear), (_, k) => k).map(() =>
        execWithSleep(async () => await fight(minimumId, false), 300),
      ),
    )

    const successCount = datas.reduce(
      (prev: number, next: number) => prev + next,
      0,
    )

    notification.success({
      duration: null,
      message: `挑战${tear}次, 成功${successCount}, 失败${tear - successCount}`,
    })
  } catch (error) {
    console.error(error)
  } finally {
    myMonsters.loading = false
  }
}

/**
 * 钱包资产类型改变
 */
const onWalletAssetChange = (assetAddress: string) => {
  walletAssets.activeAsset = assetAddress
  getWalletAssets()
}

/**
 * 设为当前对战元兽
 */
const setBattleMetamon = async (metamonId: number, showSuccessMsg = true) => {
  try {
    myMonsters.loading = true

    const { code } = await formPost<{
      code: RequestResultCode
    }>('/metamon/isFightMonster', {
      metamonId,
      address: account,
    })

    if (code === 'SUCCESS') {
      myMonsters.currentId = metamonId

      // 刷新对战列表
      await getBattleList()

      showSuccessMsg &&
        notification.success({
          message: '设置成功',
        })
    } else {
      notification.error({
        message: '设为当前对战元兽失败',
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    myMonsters.loading = false
  }
}

/**
 * 充值 uRACA 显示弹窗
 */
const onRechargeURACA = () => {
  Object.assign(currentTradeInfo, {
    payType: 1,
    name: 'uRACA',
    count: tokenBalance.raca,
  })
  currentTradeInfo.modalVisible = true
}

/**
 * 获取 uRACA 授权数量
 */
const getAllowanceURACA = async () => {
  const allowance = await contracts[address.RACA_ADDRESS].allowance(
    wallet.address,
    address.METAMON_WALLET,
  )
  tokenBalance.uRACAAllowance = parseFloat(utils.formatEther(allowance))
}

/**
 * 授权 uRACA
 */
const approveURACA = async () => {
  const approveCount = '6000'
  if (tokenBalance.raca < Number(approveCount)) {
    message.error(`RACA 余额不足${approveCount}`)
    return
  }

  await contracts[address.RACA_ADDRESS].approve(
    address.METAMON_WALLET,
    // TODO 先写死 5000
    utils.parseUnits(approveCount),
  )

  getBalanceAll()
}

/**
 * 获取 RACA 余额
 */
const getRACABalance = async () => {
  const balance = await new Contract(
    address.RACA_ADDRESS,
    ERC20_ABI,
    wallet,
  ).balanceOf(wallet.address)

  tokenBalance.raca = +utils.formatEther(balance)
}

/**
 * 获取所有余额
 */
const getBalanceAll = () => {
  getRACABalance()
  getAllowanceURACA()
  getGameAssets()
  getWalletAssets()
}

/**
 * 初始化数据
 */
const initData = async () => {
  await login()
  getBalanceAll()
  await getSelfMonster()

  // 设置第一个元兽为当前对战元兽
  // await setBattleMetamon(myMonsters.list[0].id, false)
}

initData()
</script>

<style lang="less" scoped>
.item-img {
  width: 80px;
  height: 80px;
}
.nav-item {
  cursor: pointer;
  font-size: 15px;
  font-weight: bold;
  margin-right: 20px;
  &.is-active {
    color: #1dc9c2;
  }
}
</style>
