<template>
  <a-row class="card-list" justify="center">
    <a-card
      v-for="item in monsterList"
      class="card-item"
      @click="fight(item.id)"
    >
      <template #title>
        <div>lv.{{ item.level }}: {{ item.sca }}</div>
      </template>

      <img class="item-img" :src="item.imageUrl" />
    </a-card>
  </a-row>
</template>

<script setup lang="ts">
import { formPost } from '@/utils/request'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { useRef } from '@/hooks/useRef'
import { RACA_SIGN_KEY } from '@/constants/storageKey'
import { message, Modal, notification } from 'ant-design-vue'

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

const [sign, setSign] = useRef(localStorage.getItem(RACA_SIGN_KEY) || '')
const [token, setToken] = useRef('')
const [myMonster, setMyMonster] = useRef({} as Monster)
const [monsterList, setMonsterList] = useRef([] as Monster[])

const signMessage = 'LogIn'
const login = async () => {
  const msgKey = 'login'
  message.loading({
    key: msgKey,
    duration: 0,
    content: '正在登录中',
  })
  if (!sign.value) {
    const res = await wallet.signMessage(signMessage)
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
    setToken(data)
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

const getSelfMonster = async () => {
  const { code, data } = await formPost<{
    code: string
    data: { monster: Monster }
  }>(
    '/metamon/getFightMonster',
    {
      address: account,
    },
    { accesstoken: token.value },
  )

  if (code === 'SUCCESS') {
    setMyMonster(data.monster)
  } else {
    notification.error({
      message: '获取我的元兽失败',
    })
  }
}

const getMonsters = async () => {
  const { code, data } = await formPost<{
    code: string
    data: { number: number; objects: Monster[] }
  }>(
    '/metamon/getBattelObjects',
    {
      address: account,
      metamonId: myMonster.value.id,
      front: 1,
    },
    { accesstoken: token.value },
  )
  if (code === 'SUCCESS') {
    setMonsterList(data.objects)
  } else {
    notification.error({
      message: '获取对战列表失败',
    })
  }
}

const startPay = async (monsterB: number) => {
  const { code, data } = await formPost<{
    code: string
    data: { amount: number; pay: boolean }
  }>(
    '/metamon/startPay',
    {
      monsterA: myMonster.value.id,
      monsterB,
      address: account,
      battleLevel: 1,
    },
    { accesstoken: token.value },
  )

  if (code === 'SUCCESS' && data.pay) {
    return true
  } else {
    throw new Error('支付失败')
  }
}

const fight = async (monsterB: number) => {
  await startPay(monsterB)

  const { code, data } = await formPost<{
    code: string
    data: { challengeResult: boolean }
  }>(
    '/metamon/startBattle',
    {
      monsterA: myMonster.value.id,
      monsterB,
      address: account,
      battleLevel: 1,
    },
    { accesstoken: token.value },
  )
  if (code === 'SUCCESS') {
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
  } else {
    notification.error({
      message: '获取对战列表失败',
    })
  }
}

const initData = async () => {
  await login()
  await getSelfMonster()
  await getMonsters()
}

initData()
</script>
