<template>
  <div class="p-15">
    <div class="mb-10">
      挑战boss等级:
      <a-input-number
        class="mr-10"
        :min="0"
        :max="2"
        :step="1"
        v-model:value="bossLevel"
      ></a-input-number>
      <async-button
        :api="batchFight"
        :disabled="!selectedRows.length"
        type="primary"
        >批量挑战boss</async-button
      >
    </div>
    <a-table
      row-key="id"
      :rowSelection="rowSelection"
      :bordered="true"
      :pagination="false"
      :data-source="dataSource"
    >
      <a-table-column title="ID" data-index="id"></a-table-column>
      <a-table-column title="品质" data-index="rarity"></a-table-column>
      <a-table-column title="当前能量" data-index="mana">
        <template #default="{ text }">
          {{ Number(text) }}
        </template>
      </a-table-column>
      <a-table-column title="最大能量" data-index="maxMana"></a-table-column>
      <a-table-column
        title="恢复能量时间"
        data-index="hourMana"
      ></a-table-column>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { Contract, utils } from 'ethers'
import armzABI from './abi/armz'
import fightABI from './abi/fight'
import stakingABI from './abi/staking'
import poolABI from './abi/pool'
import { ref } from 'vue'
import { message, TableProps } from 'ant-design-vue'
import { useNonceStore } from '@/store/nonce'
import { TX_QUEUE_MAXIMUM } from '@/constants'

const { wallet } = useActiveProvider()
const armzAddress = '0x3d7b0001e03096d3795Fd5D984AD679467546d73'
const fightAddress = '0x17D4dc90B06Ef4e88911Df63D860a7B5ced5997c'
const stakingAddress = '0x40570901a83172Ff790108255E58423CD01B00aE'
const poolAddress = '0xe4dd4794C915CB99f5A12cA8058d8B45fFEa8545'

const armzContract = new Contract(armzAddress, armzABI, wallet)
const fightContract = new Contract(fightAddress, fightABI, wallet)
const stakingContract = new Contract(stakingAddress, stakingABI, wallet)
const poolContract = new Contract(poolAddress, poolABI, wallet)

const dataSource = ref([] as any[])
const bossLevel = ref(0)
const selectedRows = ref([] as any[])

const rowSelection: TableProps['rowSelection'] = {
  getCheckboxProps(record: any) {
    return {
      // disabled: Number(record.mana) === 0,
    }
  },
  onChange: (_: string[], rows: any[]) => {
    selectedRows.value = rows
  },
}

const getList = async () => {
  const balance = await armzContract.balanceOf(wallet.address)
  const num = Number(balance)
  const promiseDatas: Promise<any>[] = []

  const getArmz = (i: number) =>
    new Promise((resolve, reject) => {
      armzContract
        .tokenOfOwnerByIndex(wallet.address, i)
        .then((res: any) => {
          armzContract.getArmz(res).then(resolve)
        })
        .catch((err: any) => reject(err))
    })

  for (let i = 0; i < num; i++) {
    promiseDatas.push(getArmz(i))
  }

  const datas = await Promise.all(promiseDatas)
  dataSource.value = datas
}

const getRewardsInfo = async () => {
  const data = await poolContract.getInfos(wallet.address)
  const n = Date.now() / 1e3 - data[1]
  const a = Math.floor(n / 86400)
  const rewardInfos = {
    waitingRewards: utils.formatEther(data[0]),
    lastWithdraw: n,
    fees: 0 == data[1] || a > 15 ? 30 : 30 - 2 * a,
  }

  return rewardInfos
}

const batchFight = () => {
  return new Promise<void>((resolve, reject) => {
    const messageKey = 'batchFight'
    message.loading({
      content: '批量掰手腕中, 请勿发生交易操作',
      duration: 0,
      key: messageKey,
    })

    const nonceStore = useNonceStore()
    nonceStore.updateLatestNonce().then(() => {
      // 最大交易为64
      const promises = selectedRows.value
        // 过滤没能量的
        // .filter(item => Number(item.mana) !== 0)
        .slice(0, TX_QUEUE_MAXIMUM)
        .map(
          (item, index) =>
            new Promise((resolve, reject) =>
              fightContract
                .fight(`${item.id}`, bossLevel.value, {
                  nonce: nonceStore.nonce + index,
                })
                .then((tx: any) => tx.wait())
                .then((r: any) => {
                  console.log(r)
                  const event = r.events[0].args
                  const isWin = event[0]
                  const rewards = utils.formatEther(event[1])
                  console.log({ isWin, rewards })
                  resolve(r)
                })
                .catch((err: any) => {
                  reject(err)
                  console.error(err)
                }),
            ),
        )

      Promise.all(promises)
        .then(() => {
          console.log('批量掰手腕完成')
          message.success({
            content: `批量掰手腕完成`,
            key: messageKey,
          })
          // 刷新列表
          getRewardsInfo()
          getList()
          resolve()
        })
        .catch(err => {
          console.error(err)
          message.error({
            content: `批量掰手腕失败`,
            key: messageKey,
          })
          reject()
        })
    })
  })
}

// const getStakingInfo = async () => {
//   const [staked, lock, bonus] = await stakingContract.getAllInfos(
//     wallet.address,
//   )
//   console.log([staked, lock, bonus])
//   return [staked, lock, bonus]
// }

// getStakingInfo()
getRewardsInfo()
getList()
</script>
