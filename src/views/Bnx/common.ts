import { Contract, Wallet } from 'ethers'
import miningABI from './abi/mining'
import newMiningABI from './abi/newMining'
import roleABI from './abi/role'
import playInfoABI from './abi/playInfo'
import workTypeABI from './abi/workType'
import bookMangeABI from './abi/bookManage'

export interface Hero {
  tokenId: string
  strength: number
  agility: number
  constitution: number
  willpower: number
  intelligence: number
  spirit: number
  level: number
  /**
   * 总属性
   */
  total: number
  /**
   * 角色中文
   */
  role: string
  /**
   * 角色合约地址
   */
  roleAddress: string
  /**
   * 属性能否满足打高级工作
   */
  isAdvance: boolean
}

export interface WorkingHero extends Hero {
  [x: string]: any
  /**
   * 工作类型(合约)
   */
  workType: string
  income: number
  incomeUsd: string
  /**
   * 当前是否在做高级工作
   */
  isAdvanceJob: boolean
}

export const contractAddress = {
  PlayInfoAddress: '0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A',
  NewPlayInfoAddress: '0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A',
  MiningAddress: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
  NewMiningAddress: '0x698E165F2897e4daC68671c4cDFf337bbC543767',
  BscAddress: '0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97',
  NewtokenAddress: '0xb3a6381070B1a15169DEA646166EC0699fDAeA79',
  /**
   * 战士
   */
  WarriorAddress: '0x22F3E436dF132791140571FC985Eb17Ab1846494',
  /**
   * 盗贼
   */
  RobberAddress: '0xaF9A274c9668d68322B0dcD9043D79Cd1eBd41b3',
  /**
   * 法师
   */
  MageAddress: '0xC6dB06fF6e97a6Dc4304f7615CdD392a9cF13F44',
  /**
   * 游侠
   */
  RangerAddress: '0xF31913a9C8EFE7cE7F08A1c08757C166b572a937',
  /**
   * 普通零工工作
   */
  LinggongAddress: '0xfA65a5751ef6079C1022Aa10b9163d7A2281360A',
  /**
   * 伐木工作 (限战士)
   */
  BlacksmithAddress: '0x3a4D27B77B253bdb9AFec082D8f5cDE5A4D713E1',
  /**
   * 打猎工作 (限游侠)
   */
  HunterAddress: '0x480d503B12ae928e8DcCd820CE45B2f6F39Ad598',
  /**
   * 图书管理工作 (限法师)
   */
  BookmangerAddress: '0x21D4Da5833d93944B8340788C6b463ED8420838B',
  /**
   * 酿酒工作 (限盗贼)
   */
  RangeworkAddress: '0x81E9aCe9511A7d56fd31940d1C49425CA3a2B8f8',
  /**
   * 皇室守卫工作 (level 5)
   */
  GaojiAddress: '0xC5dDbb4ac27A939D914059A023C6A35F377B67Ff',
  /**
   * 军团士兵工作 (level 6)
   */
  SixthAddress: '0xdcC5C1e7A3ADC8b7635565183a7385026502440B',
  poolAddress: '0xB84A69Ef7c5c823707b2Ba7bc23faA40f33242d1',
  poolV2Address: '0x8dFe5535576C720896E98b9c9DBAf81eE03eA903',
  routerpath: '0xA92FE30CBB04fB647068e13208F5Ecd4EA52FF8d',
  USDTAddress: '0x55d398326f99059fF775485246999027B3197955',
  gameManager: '0xfBB36Af639251427D390c0294e8745631333234f',
  FeeAddress: '0xaf6B62B020C88C52B5060B4Dbc938d2D872eA8F1',
  AirdropAddress: '0xEc39831c3b13dFfcffDE0aFcedd138F4bd0384f8',
  Token1Address: '0xAB683C1E30FDbf14dF0d2936b9842aAbB8228090',
}

export const getContracts = (wallet: Wallet) => ({
  PlayInfoAddress: new Contract(
    contractAddress.PlayInfoAddress,
    playInfoABI,
    wallet,
  ),
  NewPlayInfoAddress: new Contract(
    contractAddress.NewPlayInfoAddress,
    playInfoABI,
    wallet,
  ),
  MiningAddress: new Contract(contractAddress.MiningAddress, miningABI, wallet),
  NewMiningAddress: new Contract(
    contractAddress.NewMiningAddress,
    newMiningABI,
    wallet,
  ),
  WarriorAddress: new Contract(contractAddress.WarriorAddress, roleABI, wallet),
  RobberAddress: new Contract(contractAddress.RobberAddress, roleABI, wallet),
  MageAddress: new Contract(contractAddress.MageAddress, roleABI, wallet),
  RangerAddress: new Contract(contractAddress.RangerAddress, roleABI, wallet),
  LinggongAddress: new Contract(
    contractAddress.LinggongAddress,
    workTypeABI,
    wallet,
  ),
  BlacksmithAddress: new Contract(
    contractAddress.BlacksmithAddress,
    bookMangeABI,
    wallet,
  ),
  HunterAddress: new Contract(
    contractAddress.HunterAddress,
    bookMangeABI,
    wallet,
  ),
  BookmangerAddress: new Contract(
    contractAddress.BookmangerAddress,
    bookMangeABI,
    wallet,
  ),
  RangeworkAddress: new Contract(
    contractAddress.RangeworkAddress,
    bookMangeABI,
    wallet,
  ),
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
})

/**
 * 角色对应中文
 */
export const roleType = {
  [contractAddress.WarriorAddress]: '战士',
  [contractAddress.RobberAddress]: '盗贼',
  [contractAddress.MageAddress]: '法师',
  [contractAddress.RangerAddress]: '游侠',
}

/**
 * 高级角色主属性最低
 */
const MAIN_PROP_MIN = 85

/**
 * 高级角色副属性最低
 */
const SECOND_PROP_MIN = 60

/**
 * 是否为高级角色
 */
export function checkIsAdvancePlayer(playInfo: any[]): boolean {
  const [
    strength,
    agility,
    constitution,
    willpower,
    intelligence,
    spirit,
    level,
  ] = playInfo[0].map(Number)

  // 判断角色
  switch (playInfo[1]) {
    case contractAddress.WarriorAddress:
      return strength > MAIN_PROP_MIN && constitution > SECOND_PROP_MIN

    case contractAddress.RobberAddress:
      return agility > MAIN_PROP_MIN && strength > SECOND_PROP_MIN

    case contractAddress.MageAddress:
      return intelligence > MAIN_PROP_MIN && spirit > SECOND_PROP_MIN

    case contractAddress.RangerAddress:
      return strength > MAIN_PROP_MIN && agility > SECOND_PROP_MIN

    default:
      return false
  }
}

/**
 * 等级倍数 map
 */
const levelMultiple = {
  '1': 1,
  '2': 2,
  '3': 4,
  '4': 8,
  '5': 16,
  '6': 25,
  '7': 50,
  '8': 75,
  '9': 100,
  '10': 200,
  '11': 300,
  '12': 500,
}

/**
 * 可获得的每日金币数量
 * @param workType
 * @param mainProp
 * @param level
 * @returns
 */
export const getGoldDaily = (
  workType: string,
  mainProp: number,
  level: string,
) => {
  let gold = 0
  // 普通工作
  if (workType === contractAddress.LinggongAddress) {
    gold = 0.01
  } else {
    // 高级工

    // 二级工
    if (
      workType === contractAddress.BlacksmithAddress ||
      workType === contractAddress.HunterAddress ||
      workType === contractAddress.BookmangerAddress ||
      workType === contractAddress.RangeworkAddress
    ) {
      gold = 0.01 + (mainProp - MAIN_PROP_MIN) * 0.005
    }

    // TODO 大于 5级的高级工作
  }

  // 等级倍数 * 每秒区块 * 60 分钟 * 24 小时
  return (
    gold *
    (60 / 3) *
    levelMultiple[level as keyof typeof levelMultiple] *
    24 *
    60
  )
}

/**
 * 升级消耗 gold bnx 数量
 * 0 为 gold 数量
 * 1 为 bnx 数量
 */
export const upgradeCostPriceMap: Record<number, number[]> = {
  2: [20000, 0],
  3: [50000, 0],
  4: [150000, 0],
  5: [450000, 0],
  6: [1000000, 50],
  7: [2000000, 100],
}

/**
 * 获取升级消耗的 BNX
 * @param level
 * @param goldPrice
 * @param bnxPrice
 * @returns
 */
export function getUpgradeCostBnx(
  level: number,
  goldPrice: number,
  bnxPrice: number,
) {
  if (!level || level <= 1) {
    return '0'
  }

  let goldCost = 0
  let bnxCost = 0

  const arr = upgradeCostPriceMap[level]

  if (arr[0]) {
    goldCost = arr[0] * goldPrice
  }

  if (arr[1]) {
    bnxCost = arr[1] * bnxPrice
  }

  return ((goldCost / (bnxCost || 1) + bnxCost) / bnxPrice).toFixed(2)
}
