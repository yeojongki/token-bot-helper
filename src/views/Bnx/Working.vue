<template>
  <el-card class="page-bnx">
    <template #header>
      <div class="flex justify-between items-center">
        <div>打工列表 ({{ workingList.length }})</div>
        <div class="text-right">
          <div>总收益约 ${{ totalRewards }}</div>
          <div
            class="text-sm text-gray"
          >(bnx: ${{ bnxStore.bnxPrice }} / gold: ${{ bnxStore.goldPrice }})</div>
        </div>
      </div>
    </template>
    <div class="mb-20 flex items-center justify-between">
      <div class="flex items-center">
        <div>批量获取受益最低值 (0为不限制):</div>
        <el-input-number v-model="batcGetAwardsMin" class="ml-10 mr-10"></el-input-number>
      </div>

      <!-- :disabled="!workingSelection.length" -->
      <el-button class="ml-10" type="primary" @click="batchGetAwards(0)">批量获取受益</el-button>
    </div>

    <!-- @selection-change="workingSelectionChange" -->
    <el-table
      height="500"
      :data="workingList"
      :border="true"
      :show-summary="true"
      sum-text="合计"
      :summary-method="getIncomeSummaries"
      :default-sort="{ prop: 'income', order: 'descending' }"
    >
      <props-column :is-working="true"></props-column>
      <!-- <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="getAwardByTokenId(row.tokenId)">获取收益</el-button>
        </template>
      </el-table-column>-->
    </el-table>
  </el-card>

  <el-card class="page-bnx" :header="`未打工列表 (${noWorkingList.length})`">
    <div class="mb-10 flex items-center justify-end">
      <!-- :disabled="!noWorkingSelection.length"  -->
      <el-button class="ml-10" type="primary" @click="batchGoWork(0)">批量打工</el-button>
    </div>

    <!-- 
      @selection-change="noWorkingSelectionChange"
    -->
    <el-table height="500" :data="noWorkingList" :border="true" :show-summary="true">
      <props-column></props-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider';
import { Contract } from '@ethersproject/contracts';
import { ElCard, ElInputNumber, ElTable, ElTableColumn, ElButton, ElMessage, ElLoading, } from 'element-plus'
import { BigNumber, utils } from 'ethers';
import { computed, ref } from 'vue';
import type { Ref } from 'vue'
import type { TableColumnCtx } from 'element-plus/lib/components/table/src/table-column/defaults';
import { useRef } from '@/hooks/useRef';
import { contractAddress, getContracts, roleType, checkIsAdvancePlayer } from './common';
import type { Hero, WorkingHero } from './common';
import copyText from '@/utils/copyText';
import { forEach, reject } from 'lodash';
import AsyncButton from '@/components/AsyncButton/index.vue'
import { useBnxStore } from '@/store/bnx';
import PropsColumn from './components/PropsColumn.vue';

const { provider, account, wallet } = useActiveProvider()
const contracts = getContracts(wallet)
const [batchWorkingLoading, setBatchWorkingLoading] = useRef(false)

// 更新 bnx & 金币价格
const bnxStore = useBnxStore()
bnxStore.updateBnxAndGoldPrice()

/**
 * 总收益 $
 */
const totalRewards = computed(() => {
  const all = workingList.value.reduce((prev, next) => prev + next.income, 0)
  return (all * bnxStore.goldPrice).toFixed(2)
})

/**
 * 正在打工列表
 */
const workingList: Ref<WorkingHero[]> = ref([])

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
 * 打工列表选中
 */
const workingSelection = ref<WorkingHero[]>([])

/**
 * 打工列表勾选事件
 */
const workingSelectionChange = (val: WorkingHero[]) => {
  workingSelection.value = val
}

/**
 * 获取打工详情
 */
async function getWorkPlayerDetail(index: number, miningContract = contracts.MiningAddress): Promise<WorkingHero> {
  const tokenId = String(await miningContract.tokenOfOwnerByIndex(account, index))
  const playInfo = await contracts.PlayInfoAddress.getPlayerInfoBySet(tokenId)
  const recWorkInfo = await miningContract.getPlayerWork(tokenId)
  const [workType, , startTime] = recWorkInfo

  let income = 0
  let endBlock = (await provider.getBlockNumber()) + ''

  if (workType === contractAddress.LinggongAddress) {
    income = await contracts.LinggongAddress.getIncome(playInfo[0], startTime, endBlock)
  } else if (workType === contractAddress.BookmangerAddress) {
    income = await contracts.BookmangerAddress.getIncome(playInfo[0], startTime, endBlock)
  }

  return {
    tokenId,
    strength: Number(playInfo[0][0]),
    agility: Number(playInfo[0][1]),
    constitution: Number(playInfo[0][2]),
    willpower: Number(playInfo[0][3]),
    intelligence: Number(playInfo[0][4]),
    spirit: Number(playInfo[0][5]),
    level: Number(playInfo[0][6]),
    isAdvance: checkIsAdvancePlayer(playInfo),
    roleAddress: playInfo[1],
    role: roleType[playInfo[1] as keyof typeof roleType],
    income: Number(utils.formatEther(income)),
  }
}

/**
 * 获取普通打工信息
 */
async function getPlayerInfo(index: number, contract: Contract) {
  const tokenId = String(await contract.tokenOfOwnerByIndex(account, index))
  const playInfo = await contracts.NewPlayInfoAddress.getPlayerInfoBySet(tokenId)

  return {
    tokenId,
    strength: Number(playInfo[0][0]),
    agility: Number(playInfo[0][1]),
    constitution: Number(playInfo[0][2]),
    willpower: Number(playInfo[0][3]),
    intelligence: Number(playInfo[0][4]),
    spirit: Number(playInfo[0][5]),
    level: Number(playInfo[0][6]),
    roleAddress: playInfo[1],
    role: roleType[playInfo[1] as keyof typeof roleType],
    isAdvance: checkIsAdvancePlayer(playInfo)
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
async function getAwardByTokenId(tokenId: string) {
  try {
    const tx = await contracts.MiningAddress.getAward(tokenId)
    await tx.wait()
    ElMessage.success("获取成功")
  } catch (error) {
    ElMessage.error('获取失败, 请重试')
  }
}

/**
 * 批量获取角色奖励
 */
async function batchGetAwards(index = 0) {
  if (workingList.value[index]?.tokenId) {
    ElMessage.info(`开始获取 ${workingList.value[index]}`)

    if (workingList.value[index].income > batcGetAwardsMin.value) {
      await getAwardByTokenId(workingList.value[index].tokenId)

      index++
      await batchGetAwards(index)
    } else {
      ElMessage.info(`已跳过${workingList.value[index]}, 低于最低收益${batcGetAwardsMin.value}`)
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
 * @deprecated 有问题先不用
 */
async function _batchWork() {
  const nonce = await provider.getTransactionCount(account)

  const helper = (tokenId: string, index: number) => new Promise<void>((resolve, reject) => {
    contracts.MiningAddress.work(
      contractAddress.LinggongAddress,
      tokenId,
      {
        gasLimit: 430000,
        gasPrice: utils.parseUnits(`${5}`, 'gwei'),
        nonce: nonce + index
      }
    )
      .then((tx: any) => {
        console.log(tx)
        tx.wait()
          .then(() => {
            // 不执行了 未知原因
            console.log(`已完成${index}`)
            ElMessage.success(`已完成${index}`)
            resolve()
          })
          .catch((err: any) => {
            console.log(err)
            reject()
          })
      })
      .catch((err: any) => {
        console.log(err)
        reject()
      })
  })

  const promiseDatas: Promise<any>[] = noWorkingSelection.value.map((item, index) => helper(item.tokenId, index + 1))

  await Promise.all(promiseDatas)
  ElMessage.success(`批量打工完成`)
}


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

    ElMessage.success(`已开始打工 [${index}]`)
    index++

    batchGoWork(index)
  } else {
    ElMessage.success(`批量打工完成`)
    // 刷新打工/未打工列表
    getPlayersNoWorking()
    getWorkingPlayers()
  }
}

// 初始化列表
getPlayersNoWorking()
getWorkingPlayers()
</script>

<style lang="scss" scoped>
@import "./style.scss";
</style>
