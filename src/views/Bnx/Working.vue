<template>
  <el-card class="page-bnx">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex">
          <div>打工列表 ({{ workingList.length }})</div>
          <div class="ml-10 text-red">总收益 {{ totalRewards.gold }} ≈ ${{ totalRewards.goldUsdTotal }}</div>
        </div>
        <div class="text-right">
          <bnx-gold-price-balance></bnx-gold-price-balance>
        </div>
      </div>
    </template>
    <div class="mb-20 flex items-center justify-between">
      <div class="flex items-center">
        <div>批量获取受益最低值 (0为不限制):</div>
        <el-input-number v-model="batcGetAwardsMin" class="ml-10 mr-10"></el-input-number>
      </div>

      <!-- :disabled="!workingSelection.length" -->
      <div>
        <el-button class="ml-10" type="primary" @click="batchGetAwards(0)">批量获取受益</el-button>
        <el-button class="ml-10" type="primary" @click="batchQuitWork(0)">批量退出工作</el-button>
      </div>
    </div>

    <!-- :show-summary="true"
    sum-text="合计"
    :summary-method="getIncomeSummaries"-->
    <el-table
      height="500"
      :data="workingList"
      :border="true"
      :default-sort="{ prop: 'income', order: 'descending' }"
      @selection-change="workingSelectionChange"
    >
      <props-column :is-working="true"></props-column>
      <!-- <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="getAwardByTokenId(row.tokenId, row.isAdvanceJob)">获取收益</el-button>
        </template>
      </el-table-column>-->
    </el-table>
  </el-card>

  <el-card class="page-bnx" :header="`未打工列表 (${noWorkingList.length})`">
    <div class="mb-10 flex items-center justify-end">
      <!-- :disabled="!noWorkingSelection.length"  -->
      <el-button class="ml-10" type="primary" @click="batchGoWork(0)">批量打工</el-button>
    </div>

    <div class="flex mb-20">
      <el-input v-model="transferTo" placeholder="请输入将要转移到的钱包地址" class="mr-10"></el-input>
      <el-button :disabled="transferTo.length !== 42" type="primary" @click="transferRole(0)">转移选中角色</el-button>
    </div>

    <el-table
      @selection-change="noWorkingSelectionChange"
      height="500"
      :data="noWorkingList"
      :border="true"
    >
      <props-column></props-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider';
import { Contract } from '@ethersproject/contracts';
import { ElCard, ElInputNumber, ElTable, ElTableColumn, ElInput, ElDivider, ElButton, ElMessage, ElLoading, ElAlert, ElMessageBox, } from 'element-plus'
import { BigNumber, utils } from 'ethers';
import { computed, ref } from 'vue';
import type { Ref } from 'vue'
import type { TableColumnCtx } from 'element-plus/lib/components/table/src/table-column/defaults';
import { useRef } from '@/hooks/useRef';
import { contractAddress, getContracts, roleType, checkIsAdvancePlayer, getUpgradeCostBnx } from './common';
import type { Hero, WorkingHero } from './common';
import copyText from '@/utils/copyText';
import { forEach, reject } from 'lodash';
import AsyncButton from '@/components/AsyncButton/index.vue'
import { useBnxStore } from '@/store/bnx';
import PropsColumn from './components/PropsColumn.vue';
import BnxGoldPriceBalance from './components/BnxGoldPriceBalance.vue';
import { useNonceStore } from '@/store/nonce';

const { provider, account, wallet } = useActiveProvider()
const contracts = getContracts(wallet)
const [batchWorkingLoading, setBatchWorkingLoading] = useRef(false)

// 更新 bnx & 金币价格
const bnxStore = useBnxStore()
bnxStore.updateBnxAndGold()

/**
 * 角色转移到的目标地址
 */
const transferTo = ref('')

/**
 * 总收益 $
 */
const totalRewards = computed(() => {
  const gold = workingList.value.reduce((prev, next) => prev + next.income, 0)
  return {
    gold: gold.toFixed(2),
    goldUsdTotal: (gold * bnxStore.goldPrice).toFixed(2),
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
  const total = strength + agility + constitution + willpower + intelligence + spirit

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
async function getWorkPlayerDetail(index: number, miningContract = contracts.MiningAddress): Promise<WorkingHero> {
  const tokenId = String(await miningContract.tokenOfOwnerByIndex(account, index))
  const playInfo = await contracts.PlayInfoAddress.getPlayerInfoBySet(tokenId)
  const recWorkInfo = await miningContract.getPlayerWork(tokenId)
  const [workType, , startTime] = recWorkInfo

  let isAdvanceJob = false
  let income = 0
  let endBlock = (await provider.getBlockNumber()) + ''

  if (workType === contractAddress.LinggongAddress) {
    income = await contracts.LinggongAddress.getIncome(playInfo[0], startTime, endBlock)
  } else if (workType === contractAddress.BookmangerAddress) {
    income = await contracts.BookmangerAddress.getIncome(playInfo[0], startTime, endBlock)
    isAdvanceJob = true
  } else if (workType === contractAddress.BlacksmithAddress) {
    income = await contracts.BlacksmithAddress.getIncome(playInfo[0], startTime, endBlock)
    isAdvanceJob = true
  } else if (workType === contractAddress.RangeworkAddress) {
    income = await contracts.RangeworkAddress.getIncome(playInfo[0], startTime, endBlock)
    isAdvanceJob = true
  } else if (workType === contractAddress.HunterAddress) {
    income = await contracts.HunterAddress.getIncome(playInfo[0], startTime, endBlock)
    isAdvanceJob = true
  }

  income = Number(utils.formatEther(income))

  const baseInfo = getPlayerBaseDetail(playInfo)

  return {
    ...baseInfo,
    tokenId,
    income,
    incomeUsd: (income * bnxStore.goldPrice).toFixed(2),
    isAdvanceJob
  }
}

/**
 * 获取普通打工信息
 */
async function getPlayerInfo(index: number, contract: Contract) {
  const tokenId = String(await contract.tokenOfOwnerByIndex(account, index))
  const playInfo = await contracts.NewPlayInfoAddress.getPlayerInfoBySet(tokenId)

  const baseInfo = getPlayerBaseDetail(playInfo)

  return {
    ...baseInfo,
    tokenId,
  }
}

/**
 * 获取打工角色列表
 */
async function getWorkingPlayers() {
  const promiseDatas: Promise<WorkingHero>[] = []
  const partimeJobCount = Number(await contracts.MiningAddress.balanceOf(account))
  const newMiningJobCount = Number(await contracts.NewMiningAddress.balanceOf(account))

  for (let i = 0; i < newMiningJobCount; i++) {
    promiseDatas.push(
      new Promise<WorkingHero>((resolve, reject) => {
        getWorkPlayerDetail(i, contracts.NewMiningAddress).then(resolve).catch(reject)
      })
    )
  }

  for (let i = 0; i < partimeJobCount; i++) {
    promiseDatas.push(
      new Promise<WorkingHero>((resolve, reject) => {
        getWorkPlayerDetail(i).then(resolve).catch(reject)
      })
    )
  }

  const datas = await Promise.all(promiseDatas)
  workingList.value = datas
}

/**
 * 获取单个角色奖励 (金币)
 */
async function getAwardByTokenId(tokenId: string, isAdvanceJob: boolean) {
  try {
    const tx = isAdvanceJob
      ? await contracts.NewMiningAddress.getAward(tokenId)
      : await contracts.MiningAddress.getAward(tokenId)
    await tx.wait()
    ElMessage.success("获取成功")
  } catch (error) {
    ElMessage.error('获取失败, 请重试')
    console.log(error)
  }
}

/**
 * 批量获取角色奖励
 */
async function batchGetAwards(index = 0) {
  const item = workingSelection.value[index]
  if (item?.tokenId) {
    ElMessage.info(`开始获取 ${item.tokenId}`)

    if (item.income > batcGetAwardsMin.value) {
      await getAwardByTokenId(item.tokenId, item.isAdvanceJob)

      index++
      await batchGetAwards(index)
    } else {
      ElMessage.info(`已跳过${item}, 低于最低收益${batcGetAwardsMin.value}`)
      index++
      await batchGetAwards(index)
    }
  } else {
    ElMessage.success(`批量领取完成`)
  }
}

/**
 * 收入总计
 */
function getIncomeSummaries(param: { columns: TableColumnCtx<any>, data: WorkingHero[] }) {
  const { columns, data } = param
  const sums: string[] = []
  // @ts-ignore
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计'
      return
    }

    if (column.property === 'income') {
      const values = data.map((item) => {
        return Number(item[column.property as keyof WorkingHero])
      })
      sums[index] = `${values.reduce((prev, curr) => {
        const value = Number(curr)
        return prev + curr
      }, 0).toFixed(2)}`
    } else {
      sums[index] = ''
    }
  })

  return sums
}

/**
 * 获取未打工列表 (只做了获取最普通工作)
 */
function getPlayersNoWorking() {
  Promise.all([
    contracts.WarriorAddress.balanceOf(account),
    contracts.RobberAddress.balanceOf(account),
    contracts.MageAddress.balanceOf(account),
    contracts.RangerAddress.balanceOf(account)
  ])
    .then(res => {
      const totalCountArray = res.map(Number)
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

      Promise.all(promiseDatas).then(res => {
        noWorkingList.value = res
      })
    })
}

// 貌似不能调用 cannot estimate gas; transaction may fail or may require manual gas limit
// async function testBatchWork() {
//   const workTypes: string[] = [contractAddress.LinggongAddress, contractAddress.LinggongAddress]
//   const tokenIds: string[] = [
//     '30358607160919388292929668861537797297655737455296212743917161179304991392743',
//     '100852451566718539641855015895912029584755492001156702522723502069426165390319'
//   ]

//   const tx = await contracts.NewMiningAddress.batchWork(
//     workTypes,
//     tokenIds
//   )
//   console.log(tx)
//   await tx.wait()

//   ElMessage.success(`批量打工完成`)
// }

/**
 * 递归执行打工 (目前只做了获取最普通工作)
 */
async function batchGoWork(index = 0) {
  if (noWorkingList.value[index]?.tokenId) {
    ElMessage.info(`开始打工 [${index}]`)
    const tx = await contracts.MiningAddress.work(
      contractAddress.LinggongAddress,
      noWorkingList.value[index].tokenId
    )
    await tx.wait()
    console.log(`已开始打工 [${index}]`)
    index++

    batchGoWork(index)
  } else {
    ElMessage.success(`批量打工完成`)
    console.log(`批量打工完成`)
    // 刷新打工/未打工列表
    getPlayersNoWorking()
    getWorkingPlayers()
  }
}


/**
 * 实际调用转移选中角色执行
 */
async function transferHelper(contract: Contract, tokenId: string) {
  const tx = await contract.transferFrom(
    wallet.address,
    transferTo.value,
    tokenId,
  )
  await tx.wait()
  ElMessage.success(`转移${tokenId}成功`)
}

/**
 * 转移选中角色递归执行
 */
async function transferRole(index = 0) {
  // await ElMessageBox.confirm(`确认转移 ${noWorkingList.value.length} 个角色到 ${transferTo.value} ?`)
  // TODO 授权
  // const approvedTx = await contracts.WarriorAddress.setApprovalForAll(contractAddress.NewMiningAddress, true)
  // await approvedTx.wait()


  if (noWorkingSelection.value[index]?.tokenId) {
    const item = noWorkingSelection.value[index]
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
      transferHelper(contract, item.tokenId).then(() => {
        index++
        transferRole(index)
      })
    }
  } else {
    console.log('转移完成')
    ElMessage({
      type: 'success',
      message: '转移完成'
    })
  }

  // ElMessage({
  //   type: 'info',
  //   message: '已取消转移'
  // })
}


async function quitWorkHelper(tokenId: string) {
  const tx = await contracts.MiningAddress.quitWork(tokenId)
  await tx.wait()
  ElMessage.success(`${tokenId} 已经退出工作`)
}

function batchQuitWork(index = 0) {
  if (workingSelection.value[index]?.tokenId) {
    quitWorkHelper(workingSelection.value[index].tokenId)
      .then(() => {
        index++
        batchQuitWork(index)
      })
  } else {
    ElMessage.success('成功退出工作')
  }
}

// 初始化列表
getPlayersNoWorking()
getWorkingPlayers()
</script>

<style lang="scss" scoped>
@import "./style.scss";
</style>