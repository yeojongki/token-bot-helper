<template>
  <div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { Contract, utils } from 'ethers'
import armzABI from './abi/armz'
import fightABI from './abi/fight'
import stakingABI from './abi/staking'
import poolABI from './abi/pool'

const { wallet } = useActiveProvider()
const armzAddress = '0x3d7b0001e03096d3795Fd5D984AD679467546d73'
const fightAddress = '0xc0EdE49FfEa93caBA0f508B33db37a42e0ef3e9F'
const stakingAddress = '0x40570901a83172Ff790108255E58423CD01B00aE'
const poolAddress = '0xe4dd4794C915CB99f5A12cA8058d8B45fFEa8545'

const armzContract = new Contract(armzAddress, armzABI, wallet)
const fightContract = new Contract(fightAddress, fightABI, wallet)
const stakingContract = new Contract(stakingAddress, stakingABI, wallet)
const poolContract = new Contract(poolAddress, poolABI, wallet)

const getList = async () => {
  const balance = await armzContract.balanceOf(wallet.address)
  console.log(balance)
  const num = Number(balance)
  const promiseDatas: Promise<any>[] = []

  for (let i = 0; i < num; i++) {
    promiseDatas.push(armzContract.getArmz(i))
  }

  const datas = await Promise.all(promiseDatas)
  console.log(datas)
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

  console.log(rewardInfos)
  return rewardInfos
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
