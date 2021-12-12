/**
 * 元兽
 */
export interface Monster {
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
  /**
   * 总属性
   */
  sca: number
  scaMax: number
  status: number
  /**
   * 可对战次数
   */
  tear: number
  tokenId: number
  updateTime: string
  years: number
}

/**
 * 游戏资产
 */
export interface GameAsset {
  bpNum: number
  /**
   * 类型
   * 1 元兽蛋碎片
   * 2
   * 3
   * 4
   * 5 uRACA
   * 6 元兽蛋
   */
  bpType: number
  id: number
  owner: string
}

/**
 * 钱包资产
 */
export interface WalletAsset {
  name: string
  count: number
  address: string
  /**
   * 2 药水
   */
  payType: number
}

/**
 * 请求结果
 */
export type RequestResultCode = 'SUCCESS' | 'FAIL'

/**
 * 用到的合约地址
 */
export const address = {
  FIX_PRICE_SELL_ADDRESS: '0xE97Fdca0A3Fc76b3046aE496C1502c9d8dFEf6fc',
  RACA_ADDRESS: '0x12BB890508c125661E03b09EC06E404bc9289040',
  N_METAMON_ADDRESS: '0xF24Bf668Aa087990f1d40aBAbF841456E771913c',
  R_METAMON_ADDRESS: '0x982B5345D0f213ecb2a8e6e24336909f59B1d6E3',
  SR_METAMON_ADDRESS: '0xf278dcAe8E18E1D162Ed95bD9FF6cE8aaaBB4EE2',
  SSR_METAMON_ADDRESS: '',
  METAMON_EGG_ADDRESS: '0xD40C03B8680D4b6a4d78FC3C6F6A28C854e94A79',
  Potion_ADDRESS: '0x51353799F8550c9010a8b0CbFE6C02cA96E026E2',
  Diamond_ADDRESS: '0x5dc3FeD851e07715965E5727592CE33d14b7828D',
  METAMON_WALLET: '0xEF0Dff2D82B09c6A9fB9Cd261B3FcBb7b0560b28',
  METAMON_WALLET_V2: '0x0658A6934aEE5F3479f1FE19f8A56F4853901fec',
  fungibleTokenBundle: '0x83A0F9139Dcf4EDa6668E91017E17887802234a5',
}

/**
 * 资产类型 map
 */
const gameAssetTypeMap = {
  0: '元兽',
  1: '元兽蛋碎片',
  2: '药水',
  5: 'uRACA',
  6: '元兽蛋',
}

/**
 * 资产地址 map
 */
export const assetAddressMap = {
  [address.N_METAMON_ADDRESS]: 'N元兽',
  [address.Potion_ADDRESS]: '药水',
  [address.METAMON_EGG_ADDRESS]: '元兽蛋',
}

/**
 * 游戏资产 payType地址 map
 */
export const gameAssetPayTypeMap = {
  [address.Potion_ADDRESS]: 2,
  [address.METAMON_EGG_ADDRESS]: 5,
}

export const gameAssetPayTypeNameMap = {
  2: '药水',
  5: '元兽蛋',
}

/**
 * 根据类型格式化资产名称
 */
export const formatGameAssetNameByType = (type: number) =>
  gameAssetTypeMap[type as keyof typeof gameAssetTypeMap]

/**
 * 根据类型格式化资产名称
 * @param type
 * @returns
 */
export const formatWalletAssetNameByType = (type: number) =>
  gameAssetPayTypeNameMap[type as keyof typeof gameAssetPayTypeNameMap]

/**
 * 获取对战列表中最低属性的元兽 id
 * @param list
 * @returns
 */
export const getMinimumIdFormList = (list: Monster[]) => {
  let minimumId = list[0].id
  let minimumSca = list[0].sca

  list.forEach(item => {
    if (item.sca < minimumSca) {
      minimumId = item.id
      minimumSca = item.sca
    }
  })

  return minimumId
}
