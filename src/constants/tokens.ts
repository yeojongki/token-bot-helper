export interface TokenInfo {
  address: string
  price?: number
  symbol?: string
  chainId?: number
  decimals?: number
  logoURI?: string
}

export const WBNB_TOKEN = {
  name: 'WBNB Token',
  symbol: 'WBNB',
  address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
}

export const BUSD_TOKEN = {
  name: 'BUSD Token',
  symbol: 'BUSD',
  address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0xe9e7cea3dedca5984780bafc599bd69add087d56.png',
}

export const USDT_TOKEN = {
  name: 'Tether USD',
  symbol: 'USDT',
  address: '0x55d398326f99059fF775485246999027B3197955',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0x55d398326f99059ff775485246999027b3197955.png',
}

export default {
  [WBNB_TOKEN.address]: WBNB_TOKEN,
  [BUSD_TOKEN.address]: BUSD_TOKEN,
  [USDT_TOKEN.address]: USDT_TOKEN,
}
