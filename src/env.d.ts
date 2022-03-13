/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /**
   * 节点 URL
   */
  VITE_RPC_NODE: string
  /**
   * 私钥
   */
  VITE_PRIVATE_KEY: string
  /**
   * 钱包账号地址
   */
  VITE_WALLET_ADDRESS: string
  /**
   * 方糖 SendKey
   */
  VITE_SC: string
}
