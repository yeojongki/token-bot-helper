<template>
  <!-- <a-row class="card-list" justify="center">
    <div class="flex" v-for="item in monsterList" @click="fight(item.id)">
      <img class="item-img" :src="item.imageUrl" />
      <div>
        <div>lv.{{ item.level }}: {{ item.sca }}</div>
      </div>
    </div>
  </a-row> -->

  <div class="p-15">
    <a-table
      class="mb-20"
      row-key="id"
      :loading="monsterEggLoading"
      :bordered="true"
      :pagination="false"
      :data-source="monsterEggList"
      :columns="monsterEggColumns"
    >
    </a-table>

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
import { formPost, get } from './request'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useRef } from '@/hooks/useRef'
import { RACA_SIGN_KEY, RACA_TOKEN_KEY } from '@/constants/storageKey'
import { Button, message, notification } from 'ant-design-vue'
import { Contract, utils } from 'ethers'
import NFTABI from './abi/nft'
import fixPriceSellABI from './abi/fixPriceSell'
import { address } from './common'

/**
 * 元兽
 */
interface Monster {
  con: number
  conMax: number
  createTime: string
  crg: number
  crgMax: number
  exp: number
  expMax: number
  id: number
  imageUrl: string
  inte: number
  inteMax: number
  inv: number
  invMax: number
  isPlay: boolean
  itemId: number
  itemNum: number
  lastOwner: string
  level: number
  levelMax: number
  life: number
  lifeLL: number
  luk: number
  lukMax: number
  monsterUpdate: boolean
  owner: string
  race: string
  rarity: string
  sca: number
  scaMax: number
  status: number
  tear: number
  tokenId: number
  updateTime: string
  years: number
}

const { account, wallet } = useActiveProvider()

const contracts = {
  [address.METAMON_EGG_ADDRESS]: new Contract(
    address.METAMON_EGG_ADDRESS,
    NFTABI,
    wallet,
  ),
  [address.FIX_PRICE_SELL_ADDRESS]: new Contract(
    address.FIX_PRICE_SELL_ADDRESS,
    fixPriceSellABI,
    wallet,
  ),
}

const [sign, setSign] = useRef(localStorage.getItem(RACA_SIGN_KEY) || '')
const [token, setToken] = useRef(localStorage.getItem(RACA_TOKEN_KEY) || '')

/**
 * 元兽对战列表 loading
 */
const [monsterEggLoading, setMonsterEggLoading] = useRef(false)
/**
 * 元兽对战列表
 */
const [monsterEggList, setMonsterEggList] = useRef([])

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
 * 元兽蛋表格列
 */
const monsterEggColumns = [
  {
    title: 'id ',
    dataIndex: 'id',
  },
  {
    title: '操作',
    dataIndex: 'action',
    customRender({ record }: { record: Monster }) {
      return (
        <Button type="primary" onClick={() => onShelf(record)}>
          上架
        </Button>
      )
    },
  },
]
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
    customRender({ text }: { text: boolean }) {
      return text ? '✅' : '❌'
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
      return <img class="item-img" src={text} />
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
        <Button type="primary" onClick={() => fight(record.id)}>
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

  const { code, data } = await formPost<{ code: string; data: string }>(
    '/metamon/login',
    {
      address: account,
      sign: sign.value,
      msg: signMessage,
    },
  )

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
 * 获取当前的元兽
 */
const getSelfMonster = async () => {
  const { code, data } = await formPost<{
    code: string
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
      code: string
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
    code: string
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
    code: string
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

    return 1
  } else {
    notification.error({
      message: '获取对战列表失败',
    })
    return 0
  }
}

/**
 * 元兽升级
 */
const updateMonster = async (nftId: number) => {
  const { code } = await formPost<{
    code: string
  }>('/metamon/updateMonster', {
    nftId,
    address: account,
  })
  if (code === 'SUCCESS') {
    message.success({
      duration: 1.5,
      content: '升级成功',
    })
  } else {
    notification.error({
      message: '升级失败',
    })
  }
}

/**
 * 获取元兽蛋
 */
const getMonsterEggs = async () => {
  try {
    setMonsterEggLoading(true)
    // const count = await contracts[address.METAMON_EGG_ADDRESS].balanceOf(
    //   wallet.address,
    //   0,
    // )
    // console.log(count)
    const { code, list } = await get(
      'https://market-api.radiocaca.com/artworks',
      {
        pageNo: 1,
        pageSize: 100,
        address: account,
        status: 'not_on_sale',
      },
    )
    if (code === 200) {
      const eggs = list.filter(
        (item: any) => item.nft_address === address.METAMON_EGG_ADDRESS,
      )

      eggs && eggs.length && setMonsterEggList(eggs)
    } else {
      notification.error({
        message: '获取元兽蛋列表失败',
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    setMonsterEggLoading(false)
  }
}

// TODO
const onShelf = async (item: any) => {
  const count = 1
  await contracts[address.FIX_PRICE_SELL_ADDRESS].sell(
    item.nft_address,
    `${item.token_id}`,
    `${count}`,
    address.RACA_ADDRESS,
    utils.parseEther(`${114999}`),
    0,
    0,
  )
}

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

  message.success({
    duration: 1.5,
    content: `成功${successCount}次, 失败${20 - successCount}次`,
  })
}

const initData = async () => {
  await login()
  getMonsterEggs()
  await getSelfMonster()
  await getMonsters()
}

initData()
</script>

<style>
.item-img {
  width: 80px;
  height: 80px;
}
</style>
