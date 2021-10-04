import { Contract, Wallet } from 'ethers'
import miningABI from './abi/mining'
import newMiningABI from './abi/newMining'
import roleABI from './abi/role'
import playInfoABI from './abi/playInfo'
import workTypeABI from './abi/workType'
import bookMangeABI from './abi/bookManage'

export interface Hero {
  tokenId: string
  strength: Number
  agility: Number
  constitution: Number
  willpower: Number
  intelligence: Number
  spirit: Number
  level: Number
  role: string
}

export interface WorkingHero extends Omit<Hero, 'workType'> {
  income: number
}

export const contractAddress = {
  PlayInfoAddress: '0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A',
  NewPlayInfoAddress: '0x8b8de33B057aF4F089Dcb56F21Bc6B135F99276A',
  MiningAddress: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
  NewMiningAddress: '0x698E165F2897e4daC68671c4cDFf337bbC543767',
  BscAddress: '0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97',
  NewtokenAddress: '0xb3a6381070B1a15169DEA646166EC0699fDAeA79',
  // 战士
  WarriorAddress: '0x22F3E436dF132791140571FC985Eb17Ab1846494',
  // 盗贼
  RobberAddress: '0xaF9A274c9668d68322B0dcD9043D79Cd1eBd41b3',
  // 法师
  MageAddress: '0xC6dB06fF6e97a6Dc4304f7615CdD392a9cF13F44',
  // 游侠
  RangerAddress: '0xF31913a9C8EFE7cE7F08A1c08757C166b572a937',
  /**
   * 普通零工工作
   */
  LinggongAddress: '0xfA65a5751ef6079C1022Aa10b9163d7A2281360A',
  /**
   * 伐木工作 (限战士)
   */
  blacksmithAddress: '0x3a4D27B77B253bdb9AFec082D8f5cDE5A4D713E1',
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
  // blacksmithAddress =
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
