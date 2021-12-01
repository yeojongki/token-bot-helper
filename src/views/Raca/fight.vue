<template>
  <div class="p-15">
    <!-- 游戏背包资产表格 -->
    <a-table
      class="mb-20"
      row-key="id"
      :bordered="true"
      :columns="gameAssetsColumns"
      :pagination="false"
      :data-source="gameAssets"
    >
    </a-table>

    <!-- 钱包资产表格 -->
    <a-table
      class="mb-20"
      row-key="id"
      :loading="walletAssets.loading"
      :bordered="true"
      :pagination="false"
      :data-source="walletAssets.assets"
      :columns="walletAssets.columns"
    >
      <template #title>
        <div class="flex">
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
              'is-active': walletAssets.activeAsset === address.Potion_ADDRESS,
            }"
          >
            药水
          </div>
        </div>
      </template>
    </a-table>

    <!-- 钱包充值到游戏弹窗 -->
    <a-modal
      title="充值到游戏中"
      @ok="handleDeposit"
      :ok-button-props="{ loading: walletAssets.submitLoading }"
      v-model:visible="currentDepositInfo.modalVisible"
    >
      <a-form>
        <a-form-item label="名称">{{ currentDepositInfo.name }}</a-form-item>
        <a-form-item name="count" label="数量">
          <!-- TODO :max= -->
          <a-input-number
            :min="1"
            v-model:value="currentDepositInfo.count"
          ></a-input-number>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 我的元兽列表 -->
    <a-table
      class="mb-20"
      row-key="id"
      :loading="monsterListLoading"
      :bordered="true"
      :pagination="false"
      :data-source="[myMonster]"
      :columns="monsterColumns"
    >
    </a-table>

    <!-- 对战元兽列表 -->
    <a-table
      row-key="id"
      :loading="monsterListLoading"
      :bordered="true"
      :pagination="false"
      :data-source="monsterList"
      :columns="battleListColumns"
    >
      <template #title>
        <async-button :api="batchFight20">战斗20次</async-button>
      </template>
    </a-table>
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
  GameAsset,
  Monster,
  RequestResultCode,
  WalletAsset,
} from './common'
import { reactive } from 'vue'
import { withPoll } from '@/utils'

// const imgs = {
//   Potion:
//     'https://racawebsource.s3-accelerate.amazonaws.com/assets/1155_img/img_potion.png',
//   'Metamon Egg':
//     'https://racawebsource.s3-accelerate.amazonaws.com/assets/1155_img/img_egg.png',
//   'Yellow Diamond':
//     'https://racawebsource.s3-accelerate.amazonaws.com/assets/1155_img/img_yellow_diamond.png',
//   'Purple Diamond':
//     'https://racawebsource.s3-accelerate.amazonaws.com/assets/1155_img/img_purple_diamond.png',
//   'Black Diamond':
//     'https://racawebsource.s3-accelerate.amazonaws.com/assets/1155_img/img_black_diamond.png',
// }

const { account, wallet } = useActiveProvider()

/**
 * 用到的合约
 */
const contracts = {
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
 * 资产类型 map
 */
const assetTypeMap = {
  0: '元兽',
  1: '元兽蛋碎片',
  2: '药水',
  5: 'raca',
  6: '元兽蛋',
}

/**
 * 资产地址 map
 */
const assetAddressMap = {
  [address.N_METAMON_ADDRESS]: 'N元兽',
  [address.Potion_ADDRESS]: '药水',
  [address.METAMON_EGG_ADDRESS]: '元兽蛋',
}

/**
 * 资产 payType地址 map
 */
const assetPayTypeMap = {
  [address.Potion_ADDRESS]: 2,
}

/**
 * 根据类型格式化资产名称
 */
const formatAssetsNameByType = (type: number) =>
  assetTypeMap[type as keyof typeof assetTypeMap]

/**
 * 游戏资产
 */
const [gameAssets, setGameAssets] = useRef([] as GameAsset[])

/**
 * 钱包资产数据
 */
const walletAssets = reactive({
  assets: [] as WalletAsset[],
  loading: false,
  submitLoading: false,
  activeAsset: address.Potion_ADDRESS,
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
const [myMonster, setMyMonster] = useRef({} as Monster)

/**
 * 元兽对战列表
 */
const [monsterList, setMonsterList] = useRef([] as Monster[])

/**
 * 元兽对战列表 loading
 */
const [monsterListLoading, setMonsterListLoading] = useRef(false)

/**
 * 游戏背包资产表格列
 */
const gameAssetsColumns = [
  {
    title: 'id ',
    dataIndex: 'id',
  },
  {
    title: '名称',
    dataIndex: 'bpType',
    customRender({ record }: { record: GameAsset }) {
      return formatAssetsNameByType(record.bpType)
    },
  },
  {
    title: '数量',
    dataIndex: 'bpNum',
  },
]

/**
 * 当前钱包资产数据
 */
const currentDepositInfo = reactive({
  modalVisible: false,
  /**
   * 充值数量
   */
  count: 1,
  tokenIds: '',
  payType: -1,
  rartity: 1,
  name: '',
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
    customRender({ record }: any) {
      return (
        <Button type="link" onClick={() => updateMonster(record.id)}>
          升级
        </Button>
      )
    },
  },
]

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
  const { code, data } = await formPost<{
    code: RequestResultCode
    data: { item: GameAsset[] }
  }>('/metamon/checkBag', {
    address: account,
  })

  if (code === 'SUCCESS') {
    setGameAssets((data.item || []).filter(item => item.bpNum > 0))
  } else {
    notification.error({
      message: '获取游戏资产失败',
    })
  }
}

/**
 * 获取当前的元兽
 */
const getSelfMonster = async () => {
  const { code, data } = await formPost<{
    code: RequestResultCode
    data: { monster: Monster }
  }>('/metamon/getFightMonster', {
    address: account,
  })

  if (code === 'SUCCESS') {
    setMyMonster(data.monster)
  } else {
    notification.error({
      message: '获取我的元兽失败',
    })
  }
}

/**
 * 获取对战列表
 */
const getMonsters = async () => {
  try {
    setMonsterListLoading(true)

    const { code, data } = await formPost<{
      code: RequestResultCode
      data: { number: number; objects: Monster[] }
    }>('/metamon/getBattelObjects', {
      address: account,
      metamonId: myMonster.value.id,
      front: 1,
    })
    if (code === 'SUCCESS') {
      setMonsterList(data.objects)
    } else {
      notification.error({
        message: '获取对战列表失败',
      })
    }
  } finally {
    setMonsterListLoading(false)
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
    monsterA: myMonster.value.id,
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
    monsterA: myMonster.value.id,
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
    getMonsters()
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
    const payType = assetPayTypeMap[walletAssets.activeAsset]

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
 * TODO 上架
 */
const onShelf = async (item: any) => {
  notification.error({
    message: `TODO 未实现`,
  })
  // const count = 1
  // await contracts[address.FIX_PRICE_SELL_ADDRESS].sell(
  //   item.nft_address,
  //   `${item.token_id}`,
  //   `${count}`,
  //   address.RACA_ADDRESS,
  //   utils.parseEther(`${114999}`),
  //   0,
  //   0,
  // )
}

/**
 * 点击表格中某一项进行充值
 */
const onDeposit = (item: WalletAsset) => {
  Object.assign(currentDepositInfo, item)
  currentDepositInfo.modalVisible = true
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

/**
 * 将钱包资产充值到游戏中
 */
const handleDeposit = async () => {
  walletAssets.submitLoading = true
  try {
    const { payType, count, tokenIds = '', rartity = 1 } = currentDepositInfo
    const { code, data: orderId } = await formPost<{
      code: RequestResultCode
      data: string
    }>('/metamon/transferInBySymbol', {
      payType,
      tokenIds,
      num: count,
      rartity,
      address: account,
    })

    if (code === 'SUCCESS') {
      const contract = new Contract(
        address.METAMON_WALLET,
        metamonWalletABI,
        wallet,
      )

      // 交易哈希
      let txHash = ''

      // TODO 其他类型
      switch (payType) {
        // 药水
        case 2:
          const tx = await contract.deposit1155(
            address.Potion_ADDRESS,
            0,
            count,
            orderId,
            {
              gasLimit: 50000,
              gasPrice: utils.parseUnits(`6`, 'gwei'),
            },
          )
          txHash = tx.hash

          await tx.wait()

          break

        default:
          // TODO 完善其他类型充值
          notification.error({
            message: `${payType} 类型充值暂未实现`,
          })
          break
      }

      if (txHash) {
        await withPoll(() => checkDepositOrderStatus(txHash))

        notification.success({
          message: `充值成功`,
        })

        // 弹窗关闭
        currentDepositInfo.modalVisible = false
        // 刷新列表
        getWalletAssets()
        getGameAssets()
      }
    } else {
      notification.error({
        message: '充值失败',
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    walletAssets.submitLoading = false
  }
}

/**
 * TODO 碎片合成元兽蛋
 */
const composeMonsterEgg = async (item: any) => {}

/**
 * 战斗20次
 */
const batchFight20 = async () => {
  const datas = await Promise.all(
    monsterList.value.map(({ id }) => fight(id, false)),
  )

  const successCount = datas.reduce(
    (prev: number, next: number) => prev + next,
    0,
  )

  notification.success({
    duration: null,
    message: `成功${successCount}次, 失败${20 - successCount}次`,
  })
}

/**
 * 钱包资产类型改变
 */
const onWalletAssetChange = (assetAddress: string) => {
  walletAssets.activeAsset = assetAddress
  getWalletAssets()
}

/**
 * 初始化数据
 */
const initData = async () => {
  await login()
  getGameAssets()
  getWalletAssets()
  await getSelfMonster()
  await getMonsters()
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
