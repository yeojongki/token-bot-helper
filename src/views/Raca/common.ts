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
  sca: number
  scaMax: number
  status: number
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
   * 5 raca
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
}

/**
 * 请求结果
 */
export type RequestResultCode = 'SUCCESS' | 'FAIL'

/**
 * 用到的合约地址
 */
export const address = {
  FIX_PRICE_SELL_ADDRESS: '0x7b4452dd6c38597fa9364ac8905c27ea44425832',
  RACA_ADDRESS: '0x12BB890508c125661E03b09EC06E404bc9289040',
  N_METAMON_ADDRESS: '0xF24Bf668Aa087990f1d40aBAbF841456E771913c',
  R_METAMON_ADDRESS: '0x982B5345D0f213ecb2a8e6e24336909f59B1d6E3',
  SR_METAMON_ADDRESS: '0xf278dcAe8E18E1D162Ed95bD9FF6cE8aaaBB4EE2',
  SSR_METAMON_ADDRESS: '',
  METAMON_EGG_ADDRESS: '0xD40C03B8680D4b6a4d78FC3C6F6A28C854e94A79',
  Potion_ADDRESS: '0x51353799F8550c9010a8b0CbFE6C02cA96E026E2',
  Diamond_ADDRESS: '0x5dc3FeD851e07715965E5727592CE33d14b7828D',
  METAMON_WALLET: '0xEF0Dff2D82B09c6A9fB9Cd261B3FcBb7b0560b28',
  fungibleTokenBundle: '0x83A0F9139Dcf4EDa6668E91017E17887802234a5',
}
