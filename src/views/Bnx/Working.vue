<template>
  <a-card class="page-bnx">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex">
          <div>打工列表 ({{ workingList.length }})</div>
          <div class="ml-10 text-red">
            <div class="text-xs">
              当前收益 {{ totalRewards.currentGold }} ≈ ${{
                totalRewards.currentGoldUsdTotal
              }}
            </div>
            <div class="text-xs">
              每日收益 {{ totalRewards.dailyGold }} ≈ ${{
                totalRewards.dailyGoldUsdTotal
              }}
            </div>
          </div>
        </div>
        <div class="text-right">
          <bnx-gold-price-balance></bnx-gold-price-balance>
        </div>
      </div>
    </template>
    <div class="mb-20 flex items-center justify-between">
      <div class="flex items-center">
        <div>批量获取受益最低值 (0为不限制):</div>
        <a-input-number
          v-model="batcGetAwardsMin"
          class="ml-10 mr-10"
        ></a-input-number>
      </div>

      <!-- :disabled="!workingSelection.length" -->
      <div>
        <async-button
          class="ml-10"
          type="primary"
          :disabled="!workingSelection.length"
          :api="batchGetAwards"
          >批量获取受益</async-button
        >
        <async-button
          class="ml-10"
          type="primary"
          :disabled="!workingSelection.length"
          :api="batchQuitWork"
          >批量退出工作</async-button
        >
      </div>
    </div>

    <!-- :show-summary="true"
    sum-text="合计"
    :summary-method="getIncomeSummaries"-->
    <player-table
      :api="getWorkingPlayers"
      :is-working="true"
      :on-selection-change="workingSelectionChange"
    ></player-table>
    <!-- <el-table
      height="500"
      :data="workingList"
      :border="true"
      :default-sort="{ prop: 'income', order: 'descending' }"
      @selection-change="workingSelectionChange"
    >
      <props-column :is-working="true"></props-column>
    </el-table> -->
  </a-card>

  <a-card class="page-bnx" :header="`未打工列表 (${noWorkingList.length})`">
    <div class="flex mb-10">
      <a-input
        v-model="transferTo"
        placeholder="请输入将要转移到的钱包地址"
        class="mr-10"
      ></a-input>
      <async-button
        :disabled="transferTo.length !== 42 || !noWorkingSelection.length"
        type="primary"
        :api="transferRole"
        >转移选中角色</async-button
      >
    </div>

    <div class="flex items-center mb-10">
      <!-- <div>批量拍卖价格：</div> -->
      <a-input-number
        :min="0"
        v-model="batchAuctionPrice"
        class="mr-10 flex-1"
      ></a-input-number>
      <async-button
        :disabled="batchAuctionPrice <= 0 || !noWorkingSelection.length"
        type="primary"
        :api="batchAuction"
        >批量发布拍卖</async-button
      >
    </div>

    <div class="mb-20 flex items-center justify-end">
      <async-button
        type="primary"
        :disabled="!noWorkingSelection.length"
        :api="batchGoWork"
        >批量打工</async-button
      >
    </div>

    <player-table
      :api="getPlayersNoWorking"
      :is-no-working="true"
      :on-selectionChange="noWorkingSelectionChange"
    ></player-table>
  </a-card>

  <a-card class="page-bnx" header="工具">
    <div class="flex">
      <!-- <a-input-number
        v-model="batchNewPlayerCount"
        :step="1"
        placeholder="请输入批量抽卡数量"
        class="mr-10"
      ></a-input-number>-->
      <async-button
        :disabled="bnxStore.bnxBalance < 1"
        type="primary"
        :api="getNewPlayerOne"
        >抽卡1次</async-button
      >
      <async-button
        class="ml-10"
        :disabled="bnxStore.bnxBalance < 5"
        type="primary"
        :api="batchNewPlayer"
        >批量抽卡5次</async-button
      >
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { Contract } from '@ethersproject/contracts'
import { utils } from 'ethers'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  contractAddress,
  getContracts,
  roleType,
  checkIsAdvancePlayer,
  getGoldDaily,
  getHeroMainProp,
  getSaleContract,
} from './common'
import type { Hero, WorkingHero } from './common'
import { useBnxStore } from '@/store/bnx'
import BnxGoldPriceBalance from './components/BnxGoldPriceBalance.vue'
import { toFixed } from '@/utils'
import AsyncButton from '@/components/AsyncButton/index.vue'
import { useNonceStore } from '@/store/nonce'
import { TX_QUEUE_MAXIMUM } from '@/constants'
import PlayerTable from './components/PlayerTable.vue'

const { provider, account, wallet } = useActiveProvider()
const contracts = getContracts(wallet)

// 更新 bnx & 金币价格
const bnxStore = useBnxStore()
bnxStore.updateBnxAndGold()

/**
 * 角色转移到的目标地址
 */
const transferTo = ref('0x055Ea612D6a422Bb6CA20722b570B9E33227858E')

/**
 * 批量拍卖价格
 */
const batchAuctionPrice = ref(0.42)

/**
 * 当前收益 / 每日收益 $
 */
const totalRewards = computed(() => {
  let currentGold = 0
  let dailyGold = 0
  workingList.value.forEach(item => {
    const mainProp = getHeroMainProp(item)

    currentGold += item.income
    dailyGold += getGoldDaily(item.workType, mainProp, item.level)
  })
  return {
    currentGold: currentGold.toFixed(2),
    currentGoldUsdTotal: (currentGold * bnxStore.goldPrice).toFixed(2),
    dailyGold: dailyGold.toFixed(2),
    dailyGoldUsdTotal: (dailyGold * bnxStore.goldPrice).toFixed(2),
  }
})

/**
 * 正在打工列表
 */
const workingList: Ref<WorkingHero[]> = ref([])

/**
 * 正在打工列表选中
 */
const workingSelection = ref<WorkingHero[]>([])

/**
 * 正在打工列表勾选事件
 */
const workingSelectionChange = (val: WorkingHero[]) => {
  workingSelection.value = val
}

/**
 * 未打工列表
 */
const noWorkingList: Ref<Hero[]> = ref([])

/**
 * 未打工勾选列表
 */
const noWorkingSelection = ref<Hero[]>([])

/**
 * 未打工勾选事件
 */
const noWorkingSelectionChange = (val: Hero[]) => {
  noWorkingSelection.value = val
}

/**
 * 批量获取收入时的最低收入
 */
const batcGetAwardsMin = ref(0)

/**
 * 批量抽卡数量
 */
const batchNewPlayerCount = ref(5)

/**
 * 获取角色基础信息
 */
function getPlayerBaseDetail(playInfo: any[]) {
  const strength = Number(playInfo[0][0])
  const agility = Number(playInfo[0][1])
  const constitution = Number(playInfo[0][2])
  const willpower = Number(playInfo[0][3])
  const intelligence = Number(playInfo[0][4])
  const spirit = Number(playInfo[0][5])
  const level = Number(playInfo[0][6])

  // 总
  const total =
    strength + agility + constitution + willpower + intelligence + spirit

  return {
    strength,
    agility,
    constitution,
    willpower,
    intelligence,
    spirit,
    level: Number(playInfo[0][6]),
    total,
    isAdvance: checkIsAdvancePlayer(playInfo),
    roleAddress: playInfo[1],
    role: roleType[playInfo[1] as keyof typeof roleType],
  }
}

/**
 * 获取打工详情 (没做皇室守卫 & 军团士兵)
 */
async function getWorkPlayerDetail(
  index: number,
  miningContract = contracts.MiningAddress,
): Promise<WorkingHero> {
  const tokenId = String(
    await miningContract.tokenOfOwnerByIndex(account, index),
  )
  const playInfo = await contracts.NewPlayInfoAddress.getPlayerInfoBySet(
    tokenId,
  )
  const recWorkInfo = await miningContract.getPlayerWork(tokenId)
  const [workType, , startTime] = recWorkInfo

  let isAdvanceJob = false
  let income = 0
  let endBlock = (await provider.getBlockNumber()) + ''

  if (workType === contractAddress.LinggongAddress) {
    income = await contracts.LinggongAddress.getIncome(
      playInfo[0],
      startTime,
      endBlock,
    )
  } else if (workType === contractAddress.BookmangerAddress) {
    income = await contracts.BookmangerAddress.getIncome(
      playInfo[0],
      startTime,
      endBlock,
    )
    isAdvanceJob = true
  } else if (workType === contractAddress.BlacksmithAddress) {
    income = await contracts.BlacksmithAddress.getIncome(
      playInfo[0],
      startTime,
      endBlock,
    )
    isAdvanceJob = true
  } else if (workType === contractAddress.RangeworkAddress) {
    income = await contracts.RangeworkAddress.getIncome(
      playInfo[0],
      startTime,
      endBlock,
    )
    isAdvanceJob = true
  } else if (workType === contractAddress.HunterAddress) {
    income = await contracts.HunterAddress.getIncome(
      playInfo[0],
      startTime,
      endBlock,
    )
    isAdvanceJob = true
  }

  income = Number(utils.formatEther(income))

  const baseInfo = getPlayerBaseDetail(playInfo)
  const mainProp = getHeroMainProp({
    roleAddress: playInfo[1],
    strength: baseInfo.strength,
    agility: baseInfo.agility,
    intelligence: baseInfo.intelligence,
  })

  // 每日金币
  const goldDaily = toFixed(getGoldDaily(workType, mainProp, baseInfo.level))

  return {
    ...baseInfo,
    mainProp,
    tokenId,
    goldDaily,
    goldDailyUsd: toFixed(goldDaily * bnxStore.goldPrice),
    income,
    incomeUsd: toFixed(income * bnxStore.goldPrice),
    isAdvanceJob,
    workType,
  }
}

/**
 * 获取普通打工信息
 */
async function getPlayerInfo(index: number, contract: Contract) {
  const tokenId = String(await contract.tokenOfOwnerByIndex(account, index))
  const playInfo = await contracts.NewPlayInfoAddress.getPlayerInfoBySet(
    tokenId,
  )

  const baseInfo = getPlayerBaseDetail(playInfo)

  return {
    ...baseInfo,
    tokenId,
  } as Hero
}

/**
 * 获取打工角色列表
 */
async function getWorkingPlayers() {
  const promiseDatas: Promise<WorkingHero>[] = []
  const partimeJobCount = Number(
    await contracts.MiningAddress.balanceOf(account),
  )
  const newMiningJobCount = Number(
    await contracts.NewMiningAddress.balanceOf(account),
  )

  for (let i = 0; i < newMiningJobCount; i++) {
    promiseDatas.push(
      new Promise<WorkingHero>((resolve, reject) => {
        getWorkPlayerDetail(i, contracts.NewMiningAddress)
          .then(resolve)
          .catch(reject)
      }),
    )
  }

  for (let i = 0; i < partimeJobCount; i++) {
    promiseDatas.push(
      new Promise<WorkingHero>((resolve, reject) => {
        getWorkPlayerDetail(i).then(resolve).catch(reject)
      }),
    )
  }

  const datas = await Promise.all(promiseDatas)
  workingList.value = datas
  return datas
}

/**
 * 批量获取角色奖励
 */
function batchGetAwards() {
  return new Promise<void>((resolve, reject) => {
    const msg = message({
      type: 'info',
      message: '批量获取角色奖励中, 请勿发生交易操作',
      duration: 0,
    })

    const nonceStore = useNonceStore()
    nonceStore.updateLatestNonce().then(() => {
      // 最大交易为64
      const promises = workingSelection.value
        // 过滤最低收益
        .filter(item => item.incomeUsd > batcGetAwardsMin.value)
        .slice(0, TX_QUEUE_MAXIMUM)
        .map(({ tokenId, isAdvanceJob }, index) => {
          // const itemMsg = message({
          //   type: 'info',
          //   duration: 0,
          //   message: `开始领取 ${tokenId}`,
          // })

          const contract = isAdvanceJob
            ? contracts.NewMiningAddress
            : contracts.MiningAddress
          contract
            .getAward(tokenId, {
              nonce: nonceStore.nonce + index,
            })
            .then((tx: any) => tx.wait())
            .then(() => {
              // itemMsg.close()
              // message.success(`${tokenId}已领取`)
            })
            .catch((err: any) => console.error(err))
        })

      Promise.all(promises)
        .then(() => {
          msg.close()
          console.log('批量领取完成')
          message.success(`批量领取完成`)
          // 刷新打工列表
          getWorkingPlayers()
          resolve()
        })
        .catch(err => {
          console.error(err)
          message.error(`批量领取失败`)
          reject()
        })
    })
  })
}

/**
 * 获取未打工列表 (只做了获取最普通工作)
 */
async function getPlayersNoWorking() {
  const counts = await Promise.all([
    contracts.WarriorAddress.balanceOf(account),
    contracts.RobberAddress.balanceOf(account),
    contracts.MageAddress.balanceOf(account),
    contracts.RangerAddress.balanceOf(account),
  ])

  const totalCountArray = counts.map(Number)
  const [warriorCount, robberCount, mageCount, rangerCount] = totalCountArray

  const promiseDatas: Promise<Hero>[] = []
  for (let i = 0; i < warriorCount; i++) {
    promiseDatas.push(getPlayerInfo(i, contracts.WarriorAddress))
  }

  for (let i = 0; i < robberCount; i++) {
    promiseDatas.push(getPlayerInfo(i, contracts.RobberAddress))
  }

  for (let i = 0; i < mageCount; i++) {
    promiseDatas.push(getPlayerInfo(i, contracts.MageAddress))
  }

  for (let i = 0; i < rangerCount; i++) {
    promiseDatas.push(getPlayerInfo(i, contracts.RangerAddress))
  }

  return await Promise.all(promiseDatas)
}

/**
 * 批量打工 (目前只做了获取最普通工作)
 */
function batchGoWork() {
  return new Promise<void>((resolve, reject) => {
    const msg = message({
      type: 'info',
      message: '批量打工中, 请勿发生交易操作',
      duration: 0,
    })

    const nonceStore = useNonceStore()
    nonceStore.updateLatestNonce().then(() => {
      // 最大交易为64
      const promises = noWorkingSelection.value
        .slice(0, TX_QUEUE_MAXIMUM)
        .map(({ tokenId }, index) =>
          contracts.MiningAddress.work(
            contractAddress.LinggongAddress,
            tokenId,
            {
              nonce: nonceStore.nonce + index,
            },
          )
            .then((tx: any) => tx.wait())
            .then(() => {
              message.success(`${tokenId}已打工`)
            })
            .catch((err: any) => console.error(err)),
        )

      Promise.all(promises)
        .then(() => {
          msg.close()
          message.success(`批量打工完成`)
          console.log(`批量打工完成`)
          requestList()
          resolve()
        })
        .catch(err => {
          console.error(err)
          message.error(`批量打工失败`)
          reject()
        })
    })
  })
}

/**
 * 批量拍卖
 */
function batchAuction() {
  return new Promise<void>((resolve, reject) => {
    const saleContractNew = getSaleContract(wallet)

    const msg = message({
      type: 'info',
      message: '批量拍卖中, 请勿发生交易操作',
      duration: 0,
    })

    const nonceStore = useNonceStore()
    nonceStore.updateLatestNonce().then(() => {
      // 最大交易为64
      const promises = noWorkingSelection.value.slice(0, TX_QUEUE_MAXIMUM).map(
        (
          {
            tokenId,
            roleAddress,
            strength,
            agility,
            constitution,
            willpower,
            intelligence,
            spirit,
          },
          index,
        ) =>
          // new Promise<void>((resolve, reject) => {
          saleContractNew
            .sellPlayer(
              wallet.address,
              roleAddress,
              bnxStore.bnxAddress,
              tokenId,
              utils.parseUnits(`${batchAuctionPrice.value}`, 'ether'),
              `力${strength}/敏${agility}/体${constitution}/意${willpower}/智${intelligence}/精${spirit}`,
              {
                nonce: nonceStore.nonce + index,
              },
            )
            .then((tx: any) => tx.wait())
            .then(() => {
              // resolve()
              message.success(`${tokenId}已拍卖`)
            })
            .catch((err: any) => {
              // reject(err)
              console.error(err)
            }),
        // }),
      )

      Promise.all(promises)
        .then(() => {
          msg.close()
          message.success(`批量拍卖完成`)
          console.log(`批量拍卖完成`)
          getPlayersNoWorking()
          resolve()
        })
        .catch(err => {
          console.error(err)
          message.error(`批量拍卖失败`)
          reject()
        })
    })
  })
}

/**
 * 批量转移选中角色执行
 */
async function transferRole() {
  // await messageBox.confirm(`确认转移 ${noWorkingList.value.length} 个角色到 ${transferTo.value} ?`)
  // TODO 授权
  // const approvedTx = await contracts.WarriorAddress.setApprovalForAll(contractAddress.NewMiningAddress, true)
  // await approvedTx.wait()

  const msg = message({
    type: 'info',
    message: '批量转移中, 请勿发生交易操作',
    duration: 0,
  })

  const nonceStore = useNonceStore()
  await nonceStore.updateLatestNonce()

  // 最大交易为64
  const promises = noWorkingSelection.value
    .slice(0, TX_QUEUE_MAXIMUM)
    .map((item, index) => {
      let contract: Contract | null = null

      if (item.roleAddress === contractAddress.WarriorAddress) {
        contract = contracts.WarriorAddress
      } else if (item.roleAddress === contractAddress.MageAddress) {
        contract = contracts.MageAddress
      } else if (item.roleAddress === contractAddress.RangerAddress) {
        contract = contracts.RangerAddress
      } else if (item.roleAddress === contractAddress.RobberAddress) {
        contract = contracts.RobberAddress
      }

      if (contract) {
        return contract
          .transferFrom(wallet.address, transferTo.value, item.tokenId, {
            nonce: nonceStore.nonce + index,
          })
          .then((tx: any) => tx.wait())
          .then(() => {
            message.success(`转移${item.tokenId}成功`)
          })
          .catch((err: any) => console.error(err))
      }

      return Promise.resolve()
    })

  await Promise.all(promises)
  msg.close()
  console.log('转移完成')
  message({
    type: 'success',
    message: '转移完成',
  })

  requestList()
}

/**
 * 递归执行批量退出工作
 */
function batchQuitWork() {
  return new Promise<void>((resolve, reject) => {
    const msg = message({
      type: 'info',
      message: '批量退出工作中, 请勿发生交易操作',
      duration: 0,
    })

    const nonceStore = useNonceStore()
    nonceStore.updateLatestNonce().then(() => {
      // 最大交易为64
      const promises = workingSelection.value
        .slice(0, TX_QUEUE_MAXIMUM)
        .map(({ tokenId, isAdvanceJob }, index) => {
          // const itemMsg = message({
          //   type: 'info',
          //   duration: 0,
          //   message: `${tokenId} 正在退出工作`,
          // })

          const contract = isAdvanceJob
            ? contracts.NewMiningAddress
            : contracts.MiningAddress

          return contract
            .quitWork(tokenId, {
              nonce: nonceStore.nonce + index,
            })
            .then((tx: any) => tx.wait())
            .then(() => {
              // itemMsg.close()
              message.success(`${tokenId}已退出工作`)
            })
            .catch((err: any) => console.error(err))
        })

      Promise.all(promises)
        .then(() => {
          msg.close()
          message.success(`批量退出工作完成`)
          console.log(`批量退出工作完成`)
          requestList()
          resolve()
        })
        .catch(err => {
          console.error(err)
          reject(err)
          message.error(`批量退出工作发生错误`)
        })
    })
  })
}

/**
 * 批量抽卡
 */
async function batchNewPlayer() {
  try {
    const tx = await contracts.NewPlayInfoAddress.batchNewPlayer(
      batchNewPlayerCount.value,
      utils.parseUnits(`${batchNewPlayerCount.value}`, 'ether'),
    )
    await tx.wait()
    message.success('批量抽卡成功')

    requestList()
  } catch (error) {
    message({
      type: 'error',
      message: '批量抽卡失败',
      duration: 0,
    })
    console.error(error)
  }
}

/**
 * 抽卡1次
 */
async function getNewPlayerOne() {
  try {
    const tx = await contracts.NewPlayInfoAddress.newPlayer(
      1,
      utils.parseUnits('1', 'ether'),
    )
    await tx.wait()
    message.success('已抽卡1次')

    requestList()
  } catch (error) {
    message({
      type: 'error',
      message: '抽卡1次失败',
      duration: 0,
    })
    console.error(error)
  }
}

// 获取打工/未打工列表
const requestList = () => {
  getPlayersNoWorking()
  getWorkingPlayers()
}

requestList()
</script>
