<template>
  <el-card class="page-bnx" :header="`打工列表 (${jobsData.length})`">
    <div class="mb-10 flex items-center justify-between">
      <div class="flex items-center">
        <div>批量获取受益最低值 (0为不限制):</div>
        <el-input-number v-model="minIncome" class="ml-10 mr-10"></el-input-number>
      </div>

      <el-button
        :disabled="!multipleSelection.length"
        class="ml-10"
        type="primary"
        @click="batchGetAwards(0)"
      >批量获取受益</el-button>
    </div>
    <el-table
      :data="jobsData"
      :border="true"
      :show-summary="true"
      sum-text="合计"
      :summary-method="getSummaries"
      :default-sort="{ prop: 'income', order: 'descending' }"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="tokenId" label="Token ID" :width="100">
        <template #default="{ row }">
          <div
            class="id-column"
            :title="row.tokenID"
          >{{ row.tokenId.slice(0, 4) }}...{{ row.tokenId.slice(-4) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column prop="level" sortable label="等级" :width="80"></el-table-column>
      <el-table-column prop="income" sortable label="收益"></el-table-column>
      <!-- <el-table-column prop="income" sortable label="区块数"></el-table-column> -->
      <el-table-column prop="strength" sortable label="力量"></el-table-column>
      <el-table-column prop="agility" sortable label="敏捷"></el-table-column>
      <el-table-column prop="constitution" sortable label="体质"></el-table-column>
      <el-table-column prop="willpower" sortable label="意志"></el-table-column>
      <el-table-column prop="intelligence" sortable label="智力"></el-table-column>
      <el-table-column prop="spirit" sortable label="精神"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="getAwardByTokenId(row.tokenId)">获取收益</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-card class="page-bnx" :header="`未打工列表 (${heroNoWorkingData.length})`">
    <div class="mb-10 flex items-center justify-end">
      <el-button
        :disabled="!noWorkingMultipleSelection.length"
        class="ml-10"
        type="primary"
        @click="batchGoWork(0)"
      >批量打工</el-button>
    </div>
    <el-table
      :data="heroNoWorkingData"
      :border="true"
      :show-summary="true"
      @selection-change="noWorkingHandleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="tokenId" label="Token ID" :width="100">
        <template #default="{ row }">
          <div
            class="id-column"
            :title="row.tokenID"
          >{{ row.tokenId.slice(0, 4) }}...{{ row.tokenId.slice(-4) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column prop="level" sortable label="等级" :width="80"></el-table-column>
      <el-table-column prop="strength" sortable label="力量"></el-table-column>
      <el-table-column prop="agility" sortable label="敏捷"></el-table-column>
      <el-table-column prop="constitution" sortable label="体质"></el-table-column>
      <el-table-column prop="willpower" sortable label="意志"></el-table-column>
      <el-table-column prop="intelligence" sortable label="智力"></el-table-column>
      <el-table-column prop="spirit" sortable label="精神"></el-table-column>
      <!-- <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="getAwardByTokenId(row.tokenId)">获取收益</el-button>
        </template>
      </el-table-column>-->
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider';
import { Contract } from '@ethersproject/contracts';
import { ElCard, ElInputNumber, ElTable, ElTableColumn, ElButton, ElMessage, ElLoading, } from 'element-plus'
import { BigNumber, utils } from 'ethers';
import miningABI from './abi/mining'
import newMiningABI from './abi/newMining'
import roleABI from './abi/role'
import playInfoABI from './abi/playInfo'
import workTypeABI from './abi/workType'
import bookMangeABI from './abi/bookManage'
import { ref } from 'vue';
import type { Ref } from 'vue'
import type { TableColumnCtx } from 'element-plus/lib/components/table/src/table-column/defaults';
import { useRef } from '@/hooks/useRef';

interface Hero {
  tokenId: string
  strength: Number
  agility: Number
  constitution: Number
  willpower: Number
  intelligence: Number
  spirit: Number
  level: Number
  role: string,
}

interface WorkingHero extends Omit<Hero, 'workType'> {
  income: number,
}

const { provider, account, wallet } = useActiveProvider()

const jobsData: Ref<WorkingHero[]> = ref([])
const [listLoading, setListLoading] = useRef(false)

const heroNoWorkingData: Ref<Hero[]> = ref([])
const noWorkingMultipleSelection = ref<Hero[]>([])

// 未打工勾选事件
const noWorkingHandleSelectionChange = (val: Hero[]) => {
  noWorkingMultipleSelection.value = val
}

const contractAddress = {
  PlayInfoAddress: "0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A",
  NewPlayInfoAddress: "0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A",
  MiningAddress: "0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59",
  NewMiningAddress: "0x698E165F2897e4daC68671c4cDFf337bbC543767",
  BscAddress: "0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97",
  NewtokenAddress: "0xb3a6381070B1a15169DEA646166EC0699fDAeA79",
  // 战士
  WarriorAddress: "0x22F3E436dF132791140571FC985Eb17Ab1846494",
  // 盗贼
  RobberAddress: "0xaF9A274c9668d68322B0dcD9043D79Cd1eBd41b3",
  // 法师
  MageAddress: "0xC6dB06fF6e97a6Dc4304f7615CdD392a9cF13F44",
  // 游侠
  RangerAddress: "0xF31913a9C8EFE7cE7F08A1c08757C166b572a937",
  /**
   * 普通零工工作
   */
  LinggongAddress: "0xfA65a5751ef6079C1022Aa10b9163d7A2281360A",
  /**
   * 伐木工作 (限战士)
   */
  blacksmithAddress: "0x3a4D27B77B253bdb9AFec082D8f5cDE5A4D713E1",
  /**
   * 打猎工作 (限游侠)
   */
  HunterAddress: "0x480d503B12ae928e8DcCd820CE45B2f6F39Ad598",
  /**
   * 图书管理工作 (限法师)
   */
  BookmangerAddress: "0x21D4Da5833d93944B8340788C6b463ED8420838B",
  /**
   * 酿酒工作 (限盗贼)
   */
  RangeworkAddress: "0x81E9aCe9511A7d56fd31940d1C49425CA3a2B8f8",
  /**
   * 皇室守卫工作 (level 5)
   */
  GaojiAddress: "0xC5dDbb4ac27A939D914059A023C6A35F377B67Ff",
  /**
   * 军团士兵工作 (level 6)
   */
  SixthAddress: "0xdcC5C1e7A3ADC8b7635565183a7385026502440B",
  poolAddress: "0xB84A69Ef7c5c823707b2Ba7bc23faA40f33242d1",
  poolV2Address: "0x8dFe5535576C720896E98b9c9DBAf81eE03eA903",
  routerpath: "0xA92FE30CBB04fB647068e13208F5Ecd4EA52FF8d",
  USDTAddress: "0x55d398326f99059fF775485246999027B3197955",
  gameManager: "0xfBB36Af639251427D390c0294e8745631333234f",
  FeeAddress: "0xaf6B62B020C88C52B5060B4Dbc938d2D872eA8F1",
  AirdropAddress: "0xEc39831c3b13dFfcffDE0aFcedd138F4bd0384f8",
  Token1Address: "0xAB683C1E30FDbf14dF0d2936b9842aAbB8228090"
}

const contracts = {
  PlayInfoAddress: new Contract(contractAddress.PlayInfoAddress, playInfoABI, wallet),
  NewPlayInfoAddress: new Contract(contractAddress.NewPlayInfoAddress, playInfoABI, wallet),
  MiningAddress: new Contract(contractAddress.MiningAddress, miningABI, wallet),
  NewMiningAddress: new Contract(contractAddress.NewMiningAddress, newMiningABI, wallet),
  WarriorAddress: new Contract(contractAddress.WarriorAddress, roleABI, wallet),
  RobberAddress: new Contract(contractAddress.RobberAddress, roleABI, wallet),
  MageAddress: new Contract(contractAddress.MageAddress, roleABI, wallet),
  RangerAddress: new Contract(contractAddress.RangerAddress, roleABI, wallet),
  LinggongAddress: new Contract(contractAddress.LinggongAddress, workTypeABI, wallet),
  // blacksmithAddress =
  HunterAddress: new Contract(contractAddress.HunterAddress, bookMangeABI, wallet),
  BookmangerAddress: new Contract(contractAddress.BookmangerAddress, bookMangeABI, wallet),
  RangeworkAddress: new Contract(contractAddress.RangeworkAddress, bookMangeABI, wallet),
  // GaojiAddress =
  // SixthAddress =
  // poolAddress =
  // poolV2Address =
  // routerpath =
  // USDTAddress =
  // gameManager =
  // FeeAddress =
  // AirdropAddress =
  // Token1Address: "0xAB683C1E30FDbf14dF0d2936b9842aAbB8228090"
}

let roleType = {
  [contractAddress.WarriorAddress]: '战士',
  [contractAddress.RobberAddress]: '盗贼',
  [contractAddress.MageAddress]: '法师',
  [contractAddress.RangerAddress]: '游侠'
}

// 批量获取时的最低收入
const minIncome = ref(0)
const multipleSelection = ref<WorkingHero[]>([])

// 勾选事件
const handleSelectionChange = (val: WorkingHero[]) => {
  multipleSelection.value = val
}

// 获取打工信息
async function getPlayInfo(index: number, miningContract = contracts.MiningAddress): Promise<WorkingHero> {
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
    role: roleType[playInfo[1] as keyof typeof roleType],
    income: Number(utils.formatEther(income)),
  }
}

// 获取普通信息
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
    role: roleType[playInfo[1] as keyof typeof roleType],
  }
}

async function initData() {
  try {
    const promiseDatas: Promise<WorkingHero>[] = []
    const partimeJobCount = Number(await contracts.MiningAddress.balanceOf(account))
    const newMiningJobCount = Number(await contracts.NewMiningAddress.balanceOf(account))

    for (let i = 0; i < newMiningJobCount; i++) {
      promiseDatas.push(
        new Promise<WorkingHero>((resolve, reject) => {
          getPlayInfo(i, contracts.NewMiningAddress).then(resolve).catch(reject)
        })
      )
    }

    for (let i = 0; i < partimeJobCount; i++) {
      promiseDatas.push(
        new Promise<WorkingHero>((resolve, reject) => {
          getPlayInfo(i).then(resolve).catch(reject)
        })
      )
    }

    const datas = await Promise.all(promiseDatas)
    jobsData.value = datas
  } finally {
    setListLoading(false)
  }
}

/**
 * 获取单个角色金币
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
  if (multipleSelection.value[index]?.tokenId) {
    ElMessage.info(`开始获取 ${multipleSelection.value[index]}`)

    if (multipleSelection.value[index].income > minIncome.value) {
      await getAwardByTokenId(multipleSelection.value[index].tokenId)

      index++
      await batchGetAwards(index)
    } else {
      ElMessage.info(`已跳过${multipleSelection.value[index]}, 低于最低收益${minIncome.value}`)
      index++
      await batchGetAwards(index)
    }
  } else {
    ElMessage.success(`批量领取完成`)
  }
}

/**
 * 总计
 */
const getSummaries = (param: { columns: TableColumnCtx<any>, data: WorkingHero[] }) => {
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

function getCardsNotWork() {
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
        heroNoWorkingData.value = res
      })
    })
}

async function batchGoWork(index = 0) {
  if (noWorkingMultipleSelection.value[index]?.tokenId) {
    ElMessage.info(`开始打工 ${noWorkingMultipleSelection.value[index].tokenId}`)
    const tx = await contracts.MiningAddress.work(contractAddress.LinggongAddress, noWorkingMultipleSelection.value[index].tokenId)
    await tx.wait()
    ElMessage.success(`已开始打工 ${noWorkingMultipleSelection.value[index]?.tokenId}`)
    index++
    batchGoWork(index)
  } else {
    ElMessage.success(`批量打工完成`)
    getCardsNotWork()
  }
}

getCardsNotWork()
initData()
</script>

<style lang="scss" scoped>
.page-bnx {
  margin: 20px;
  .id-column {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>