import { Button } from 'antd';
import { useMount } from 'ahooks';
import Dapp from '@hightall/dapp-lib'
import './App.css';
import { reloadDapp } from "./dapp";
import ERC20Abi from "./abi/ERC20.json";
import ERC1155Abi from "./abi/ERC1155.json";
import MetamonWalletAbi from "./abi/MetamonWallet.json"
import NFT721Abi from "./abi/NFT721.json"


function App() {
  const onDappEnabled = (account) => {
    // console.log('account', account)
    localStorage.setItem('account-address', account.address);
  }
  useMount(() => {
    reloadDapp(onDappEnabled);
  })

  const getAddress = (NetworkEnv) => {
    return {
      RACA_ADDRESS: NetworkEnv == 'main' ? '0x12BB890508c125661E03b09EC06E404bc9289040' : '0xEd8bF39e18D547b72c0B2CF0a03E3f501380B742',
      N_METAMON_ADDRESS: NetworkEnv == 'main' ? '0xF24Bf668Aa087990f1d40aBAbF841456E771913c' : '0xed06dC3D06C30c42626ECcf69f8967d83C31AE57',
      R_METAMON_ADDRESS: NetworkEnv == 'main' ? '0x982B5345D0f213ecb2a8e6e24336909f59B1d6E3' : '0x1644b607030a6C4467F5CdD49BFA327427c3318b',
      SR_METAMON_ADDRESS: NetworkEnv == 'main' ? '0xf278dcAe8E18E1D162Ed95bD9FF6cE8aaaBB4EE2' : '0x170179C73768060096F16B96c4545ba350b08aAF',
      SSR_METAMON_ADDRESS: NetworkEnv == 'main' ? '' : '',
      METAMON_EGG_ADDRESS: NetworkEnv == 'main' ? '0xD40C03B8680D4b6a4d78FC3C6F6A28C854e94A79' : '0x6ae7e8414BE0564f0197D944bBE618BAFC5BAaDA',
      Potion_ADDRESS: NetworkEnv == 'main' ? '0x51353799F8550c9010a8b0CbFE6C02cA96E026E2' : '0x48ff8346101E55038ebdF0abB56144A75D1bF7cF',
      Diamond_ADDRESS: NetworkEnv == 'main' ? '0x5dc3FeD851e07715965E5727592CE33d14b7828D' : '0x87e1c80615CEea9a00D1C7D93A6972AC60F14291',
      METAMON_WALLET: NetworkEnv == 'main' ? '0xEF0Dff2D82B09c6A9fB9Cd261B3FcBb7b0560b28' : '0xB2E89c53735835e09b7C6c3a5C3CA121719F1460'
    }
  }
  /** 获取登陆的网络名称 */
  const getNetworkChainName = () => {
    let networkChainName = '';
    window.dapp && window.dapp._networks.forEach(v => {
      if (v.chainId == window.dapp.network.chainId) {
        localStorage.setItem('networkChainName', v.config.chainName)
        networkChainName = v.config.chainName
      }
    })
    return networkChainName
  }
  /** 设置登陆网络 */
  const setNetworkEnv = (NetworkEnv) => {
    // 0 loacl 1 test 2 main
    window.networkEnv = NetworkEnv == 2 ? 'main' : 'test'
    localStorage.setItem('networkEnv', window.networkEnv)
    console.log(window.networkEnv)
  }

  /** 获取登陆状态 */
  const getLoginState = () => {
    if (localStorage.getItem('account-address') && localStorage.getItem('connect-method') && localStorage.getItem('connect-sign')) {
      /** 有address 和 method 是连接登陆 */
      return {
        state: true,
        'address': localStorage.getItem('account-address'),
        'method': localStorage.getItem('connect-method'),
        'sign': localStorage.getItem('connect-sign'),
        'networkChainName': getNetworkChainName()
      }
    } else {
      /** 未登录状态 */
      return {
        state: false,
        'address': '',
        'method': '',
        'sign': '',
        'networkChainName': getNetworkChainName()
      }
    }
  }
  /** 退出登录 */
  const LogOut = () => {
    localStorage.clear();
  }

  /** 钱包登陆 */
  let ethereum = window.ethereum;//存储MetaMask插件对象
  const connectWallet = async (connectMethod) => {
    if (connectMethod == 'MetaMask' && !window.ethereum.isMetaMask) {
      window.ethereum = ethereum
    }
    const options = {
      extension: connectMethod,
    }
    // console.log(connectMethod)
    if (connectMethod === 'WalletConnect') {
      options.providerOptions = {
        rpc: {
          97: 'https://data-seed-prebsc-2-s3.binance.org:8545/',
          56: 'https://bsc-dataseed.binance.org/'
        },
        chainId: window.networkEnv === 'main' ? 56 : 97,
      }
    }
    let dapp = new Dapp(options);
    dapp.onEnabled((account) => onDappEnabled(account));
    // console.log('连接的网络是', window.networkEnv)
    try {
      await dapp.enableBrowserExtension(window.networkEnv);
    } catch (err) {
      console.log(err)
      return {
        message: 'err',
        description: err,
      }
    }
    // console.dir(dapp)

    /** 已登陆 可获取签名*/
    if (dapp.currentAccount && dapp.currentAccount.address) {
      window.dapp = dapp;
      localStorage.setItem('connect-method', connectMethod);
      /** 获取钱包登陆签名 账号不变，message 不变，签名应该是不变的*/
      let sig
      const message = 'LogIn';
      try {
        if (connectMethod === 'MetaMask') {
          // Ref EIP-712, sign data that has a structure
          sig = await dapp.personalSign(message)
        } else {
          // Binance Chain Wallet doesn't support signTypedData yet
          sig = await dapp.signMessage(message)
        }
      } catch (err) {
        /** 签名失败 */
        console.log(err)
        return {
          message: 'err',
          description: err,
        }
      }
      // 存储签名
      localStorage.setItem('connect-sign', sig)
      return {
        message: 'ok',
        description: `login successful`,
        value: {
          address: dapp.currentAccount.address,
          sign: sig,
          msg: message,
          networkChainName: getNetworkChainName()
        }
      }
    } else {
      return {
        message: 'err', description: 'No dapp.currentAccount.address'
      }
    }
  }

  /** 支付 
   * 支付需要授权金额充足
  */
  // const buy = async (price, orderId) => {
  //   if (window.dapp) {
  //     /** 支付 */
  //     try {
  //       /** 获取授权raca Allowance */
  //       const allowance = await window.dapp.queryContract(getAddress(window.networkEnv).RACA_ADDRESS, ERC20Abi, "allowance", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
  //       console.log(window.dapp.formatUnits(allowance.toString()))

  //       if (price > window.dapp.formatUnits(allowance.toString())) {
  //         await ApproveRACA(price)
  //         RechargeRACA(price, orderId)
  //       } else {
  //         RechargeRACA(price, orderId)
  //       }


  //     } catch (err) {
  //       console.log(err)
  //       return { message: 'err', description: err }
  //     }

  //   } else {
  //     return { message: 'err', description: 'No dapp' }
  //   }

  // }
  /** 转换金额 需要进行金额转换，*10^18，前端金额转换方 */
  /** 支付 
   * price 金额
   * orderID 订单号
  */
  const RechargeRACA = async (price, orderId) => {
    if (!price) {
      return { message: 'err', description: 'price不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        /** 获取授权raca Allowance */
        const allowance = await window.dapp.queryContract(getAddress(window.networkEnv).RACA_ADDRESS, ERC20Abi, "allowance", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(window.dapp.formatUnits(allowance.toString()))
        if (price > window.dapp.formatUnits(allowance.toString())) {
          return {
            message: 'err',
            description: `transfer amount exceeds allowance`,
          }
        }
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "depositRACA", window.dapp.parseUnits(String(price)), orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `buy hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }

  }
  /** 获取授权raca Allowance */
  const getApproveAllowance = async () => {
    if (window.dapp) {
      /** 获取授权金额 */
      try {
        const allowance = await window.dapp.queryContract(getAddress(window.networkEnv).RACA_ADDRESS, ERC20Abi, "allowance", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(window.dapp.formatUnits(allowance.toString()))
        return {
          message: 'ok',
          description: `Allowance`,
          value: {
            allowance: window.dapp.formatUnits(allowance.toString())
          }
        }
      } catch (err) {
        console.log(err)
        return
      }

    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** 授权raca 
   * price 金额
  */
  const ApproveRACA = async (price) => {
    if (!price) {
      return { message: 'err', description: 'price不能为空' }
    }
    if (window.dapp) {
      /** 获取授权金额 */
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).RACA_ADDRESS, ERC20Abi, "approve", getAddress(window.networkEnv).METAMON_WALLET, window.dapp.parseUnits(String(price)))
        console.dir(tx)
        return {
          message: 'ok',
          description: `allowance`,
          value: {
            tx: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }

    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }



  /** 元兽充值地址
   * rarity 等级 string N R SR SSR */
  const MetamonAddress = (rarity) => {
    if (rarity == 'N') {
      return getAddress(window.networkEnv).N_METAMON_ADDRESS
    } else if (rarity == 'R') {
      return getAddress(window.networkEnv).R_METAMON_ADDRESS
    } else if (rarity == 'SR') {
      return getAddress(window.networkEnv).SR_METAMON_ADDRESS
    } else if (rarity == 'SSR') {
      return getAddress(window.networkEnv).SSR_METAMON_ADDRESS
    }
  }
  /** metamon 充值 
   * rarity 等级 
   * tokenIds Array 元兽id列表
   * orderId 订单号
  */
  const DepositMetamon = async (rarity, tokenIds, orderId) => {
    if (!rarity) {
      return { message: 'err', description: 'rarity不能为空' }
    }
    if (tokenIds == undefined || tokenIds == 'undefined') {
      return { message: 'err', description: 'tokenIds不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        let METAMON_ADDRESS = MetamonAddress(rarity)
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "deposit721ByIds", METAMON_ADDRESS, tokenIds, orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositMetamon hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** metamon Approve 
   * rarity 等级 string
   * setApprove boolean
  */
  const DepositMetamonApprove = async (rarity, setApprove = true) => {
    if (!rarity) {
      return { message: 'err', description: 'rarity不能为空' }
    }

    if (window.dapp) {
      try {
        const METAMON_ADDRESS = MetamonAddress(rarity)
        const tx = await window.dapp.runContractTransactionFunc(METAMON_ADDRESS, NFT721Abi, "setApprovalForAll", getAddress(window.networkEnv).METAMON_WALLET, setApprove)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositMetamonApprove hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** metamon Approve state */
  const DepositMetamonApproveState = async (rarity) => {
    if (!rarity) {
      return { message: 'err', description: 'rarity不能为空' }
    }
    if (window.dapp) {
      try {
        const METAMON_ADDRESS = MetamonAddress(rarity)
        const state = await window.dapp.queryContract(METAMON_ADDRESS, NFT721Abi, "isApprovedForAll", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(state.toString())
        return {
          message: 'ok',
          description: `DepositMetamonApproveState`,
          value: {
            state: state[0]
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }


  /** Egg
   * count 数量
   * orderid 订单号
   */
  const DepositEgg = async (count, orderId) => {
    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "deposit1155", getAddress(window.networkEnv).METAMON_EGG_ADDRESS, 0, Number(count), orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositEgg hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Egg Approve */
  const DepositEggApprove = async () => {
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_EGG_ADDRESS, ERC1155Abi, "setApprovalForAll", getAddress(window.networkEnv).METAMON_WALLET, true)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositEggApprove hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Egg Approve state */
  const DepositEggApproveState = async () => {

    if (window.dapp) {
      try {
        const state = await window.dapp.queryContract(getAddress(window.networkEnv).METAMON_EGG_ADDRESS, ERC1155Abi, "isApprovedForAll", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(state.toString())
        return {
          message: 'ok',
          description: `DepositEggApproveState`,
          value: {
            state: state[0]
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }



  /** Potion
   * count 数量
   * orderid 订单号
   */
  const DepositPotion = async (count, orderId) => {

    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "deposit1155", getAddress(window.networkEnv).Potion_ADDRESS, 0, Number(count), orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositPotion hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Potion Approve */
  const DepositPotionApprove = async () => {
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).Potion_ADDRESS, ERC1155Abi, "setApprovalForAll", getAddress(window.networkEnv).METAMON_WALLET, true)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositPotionApprove hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Potion Approve state */
  const DepositPotionApproveState = async () => {

    if (window.dapp) {
      try {
        const state = await window.dapp.queryContract(getAddress(window.networkEnv).Potion_ADDRESS, ERC1155Abi, "isApprovedForAll", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(state.toString())
        return {
          message: 'ok',
          description: `DepositPotionApproveState`,
          value: {
            state: state[0]
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }


  /** Diamond
   * count 数量
   * orderid 订单号
   * tokenid Yellow Diamond(0); Purple Diamond(1)
   */

  const DepositDiamond = async (tokenId, count, orderId) => {
    if (tokenId == undefined || tokenId == 'undefined') {
      return { message: 'err', description: 'tokenId不能为空' }
    }
    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    console.log('充值钻石2', tokenId, count, orderId)
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "deposit1155", getAddress(window.networkEnv).Diamond_ADDRESS, tokenId, Number(count), orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositDiamond hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Diamond Approve */
  const DepositDiamondApprove = async () => {
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).Diamond_ADDRESS, ERC1155Abi, "setApprovalForAll", getAddress(window.networkEnv).METAMON_WALLET, true)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositDiamondApprove hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** Diamond Approve state */
  const DepositDiamondApproveState = async () => {

    if (window.dapp) {
      try {
        const state = await window.dapp.queryContract(getAddress(window.networkEnv).Diamond_ADDRESS, ERC1155Abi, "isApprovedForAll", localStorage.getItem('account-address'), getAddress(window.networkEnv).METAMON_WALLET)
        console.log(state.toString())
        return {
          message: 'ok',
          description: `DepositDiamondApproveState`,
          value: {
            state: state[0]
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }



  /** 提取 */
  /** WithdrawMetamon
   * rarity 等级 string N R SR SSR
   * tokenIds Array 元兽id列表
   * orderId 订单号
   */
  const WithdrawMetamon = async (rarity, tokenIds, orderId) => {
    if (!rarity) {
      return { message: 'err', description: 'rarity不能为空' }
    }
    if (tokenIds == undefined || tokenIds == 'undefined') {
      return { message: 'err', description: 'tokenIds不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        let METAMON_ADDRESS = MetamonAddress(rarity)
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "withdraw721ByIds", METAMON_ADDRESS, tokenIds, orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `WithdrawMetamon hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }

  /** 提取 */
  /** WithdrawEgg
   * count 数量
   * message 后端获取的提取Egg message
   * signature 后端获取的提取Egg signature
   * orderid 订单
   */
  const WithdrawEgg = async (count, message, signature, orderId) => {
    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    if (!message) {
      return { message: 'err', description: 'message不能为空' }
    }
    if (!signature) {
      return { message: 'err', description: 'signature不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        console.log(orderId)
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "withdraw1155", getAddress(window.networkEnv).METAMON_EGG_ADDRESS, 0, Number(count), message, signature, orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `WithdrawEgg hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }

  /** 提取
   * Potion
   * count 数量
   * message 
   * signature
   * orderid 订单号
   */
  const WithdrawPotion = async (count, message, signature, orderId) => {
    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    if (!message) {
      return { message: 'err', description: 'message不能为空' }
    }
    if (!signature) {
      return { message: 'err', description: 'signature不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "withdraw1155", getAddress(window.networkEnv).Potion_ADDRESS, 0, Number(count), message, signature, orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `DepositPotion hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }

  /** 提取
   * Diamond
   * tokenid Yellow Diamond(0); Purple Diamond(1)
   * count 数量
   * message
   * signature
   * orderid 订单号
   * 
   */
  const WithdrawDiamond = async (tokenId, count, message, signature, orderId) => {
    if (tokenId == undefined || tokenId == 'undefined') {
      return { message: 'err', description: 'tokenId不能为空' }
    }
    if (!count) {
      return { message: 'err', description: 'count不能为空' }
    }
    if (!message) {
      return { message: 'err', description: 'message不能为空' }
    }
    if (!signature) {
      return { message: 'err', description: 'signature不能为空' }
    }
    if (!orderId) {
      return { message: 'err', description: 'orderId不能为空' }
    }
    if (window.dapp) {
      try {
        const tx = await window.dapp.runContractTransactionFunc(getAddress(window.networkEnv).METAMON_WALLET, MetamonWalletAbi, "withdraw1155", getAddress(window.networkEnv).Diamond_ADDRESS, tokenId, Number(count), message, signature, orderId)
        console.log(tx)
        return {
          message: 'ok',
          description: `WithdrawDiamond hash`,
          value: {
            hash: tx.hash
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  /** 获取钱包资产 */
  const getWalletAsset = async () => {

    if (window.dapp) {
      try {
        const potion_num = await window.dapp.queryContract(getAddress(window.networkEnv).Potion_ADDRESS, ERC1155Abi, "balanceOf", localStorage.getItem('account-address'), 0)
        const yDiamond_num = await window.dapp.queryContract(getAddress(window.networkEnv).Diamond_ADDRESS, ERC1155Abi, "balanceOf", localStorage.getItem('account-address'), 0)
        const pDiamond_num = await window.dapp.queryContract(getAddress(window.networkEnv).Diamond_ADDRESS, ERC1155Abi, "balanceOf", localStorage.getItem('account-address'), 1)
        const egg_num = await window.dapp.queryContract(getAddress(window.networkEnv).METAMON_EGG_ADDRESS, ERC1155Abi, "balanceOf", localStorage.getItem('account-address'), 0)

        console.log(potion_num.toString(), yDiamond_num.toString(), pDiamond_num.toString(), egg_num.toString())
        return {
          message: 'ok',
          description: `WalletAsset`,
          value: {
            potion_num: potion_num.toString(),
            yDiamond_num: yDiamond_num.toString(),
            pDiamond_num: pDiamond_num.toString(),
            egg_num: egg_num.toString()
          }
        }
      } catch (err) {
        console.log(err)
        return { message: 'err', description: err }
      }
    } else {
      return { message: 'err', description: 'No dapp' }
    }
  }
  // /** 测试 */
  // setNetworkEnv('2')



  window.webDapp = new Object();
  /** 设置登陆网络 */
  window.webDapp.setNetworkEnv = setNetworkEnv
  /** 登陆状态 */
  window.webDapp.getLoginState = getLoginState
  /** 退出登陆 */
  window.webDapp.LogOut = LogOut
  /** 登陆 */
  window.webDapp.connectWallet = connectWallet
  /** 充值raca */
  window.webDapp.RechargeRACA = RechargeRACA
  /** 获取raca 授权金额 */
  window.webDapp.getApproveAllowance = getApproveAllowance
  /** 授权raca */
  window.webDapp.ApproveRACA = ApproveRACA
  /** metamon 充值 */
  window.webDapp.DepositMetamon = DepositMetamon
  /** metamon Approve */
  window.webDapp.DepositMetamonApprove = DepositMetamonApprove
  /** metamon Approve state */
  window.webDapp.DepositMetamonApproveState = DepositMetamonApproveState
  /** Egg 充值 */
  window.webDapp.DepositEgg = DepositEgg
  /** Egg Approve */
  window.webDapp.DepositEggApprove = DepositEggApprove
  /** Egg Approve state */
  window.webDapp.DepositEggApproveState = DepositEggApproveState
  /** Potion 充值 */
  window.webDapp.DepositPotion = DepositPotion
  /** Potion Approve */
  window.webDapp.DepositPotionApprove = DepositPotionApprove
  /** Potion Approve state */
  window.webDapp.DepositPotionApproveState = DepositPotionApproveState
  /** Diamond 充值 */
  window.webDapp.DepositDiamond = DepositDiamond
  /** Diamond Approve */
  window.webDapp.DepositDiamondApprove = DepositDiamondApprove
  /** Diamond Approve state */
  window.webDapp.DepositDiamondApproveState = DepositDiamondApproveState
  /** Metamon 提现*/
  window.webDapp.WithdrawMetamon = WithdrawMetamon
  /** Egg 提现*/
  window.webDapp.WithdrawEgg = WithdrawEgg
  /** Potion 提现*/
  window.webDapp.WithdrawPotion = WithdrawPotion
  /** Diamond 提现*/
  window.webDapp.WithdrawDiamond = WithdrawDiamond
  /** 获取钱包资产 */
  window.webDapp.getWalletAsset = getWalletAsset


  return (
    <div className="App">
      <Button onClick={() => connectWallet('MetaMask')}>Metamask</Button>
      <Button onClick={() => connectWallet('WalletConnect')}>Wallnet Connect</Button>
      <Button onClick={() => RechargeRACA(1000, '1452195908796023296')}>buy</Button>
      <Button onClick={() => ApproveRACA(1000)}>ApproveRACA</Button>
      <Button onClick={() => DepositMetamonApproveState("N")}>DepositMetamonApproveState</Button>
      <Button onClick={() => DepositMetamonApprove("N", false)}>DepositMetamonApprove</Button>
      <Button onClick={() => DepositMetamon("N", ['120229'], '1451751227628978432')}>DepositMetamon N</Button>
      <Button onClick={() => DepositEgg(1, '1452603286846702080')}>DepositEgg</Button>
      <Button onClick={() => DepositEggApprove()}>DepositEggApprove</Button>
      <Button onClick={() => DepositEggApproveState()}>DepositEggApproveState</Button>
      <Button onClick={() => WithdrawEgg(2, '0xbfc43e44d5696e77d91ed4946576a54a19e310db81b7ab50ef892859ab00ad8c', '0xecf37facff531d1e080b74d3c394c16da7eb6ce734b047c8346f722513c4ea344d2c852c8297af11e868877169854abf97fc4b92ba94959cee59496d426ae1781b', '1451475251531612416')}>WithdrawEgg</Button>
      <Button onClick={() => DepositPotion(2, '1451479597526810880')}>DepositPotion</Button>
      <Button onClick={() => DepositPotionApprove()}>DepositPotionApprove</Button>
      <Button onClick={() => DepositPotionApproveState()}>DepositPotionApproveState</Button>
      <Button onClick={() => WithdrawPotion(2, '0x7625a3b3529e55e1dc55b6f7fadcc7320cfb25b5123241e37b8c9ddc906a1d36', '0x06426f704ed04fe5f0b6857f4d500c9d551ede6a90ee8781534181abf5acd6e9118b8c0b84ae19a20a2a3c8e3c81d94d151cce057b19e130dd7834ea30043e171b', '1451487084053266688')}>WithdrawPotion</Button>
      <Button onClick={() => DepositDiamond(0, 2, '1451481148295217408')}>Y DepositDiamond</Button>
      <Button onClick={() => DepositDiamond(1, 2, '1451481704355070208')}>P DepositDiamond</Button>
      <Button onClick={() => DepositDiamondApprove()}>DepositDiamondApprove</Button>
      <Button onClick={() => DepositDiamondApproveState()}>DepositDiamondApproveState</Button>
      <Button onClick={() => WithdrawDiamond(0, 2, '0x9249a6a84c420e6566e40a0d8c5e4189adae0dc319cf40df3180338775d49011', '0x93ca11b7ccb728707029ebc7d39f29a257c3da6cb91923ebd82d1b4fd118ec7314f7114991b7aada244b5a28aca0cacd4ca84d4407082a591dcd5631444fee211c', '1452460923943911936')}>Y WithdrawDiamond</Button>
      <Button onClick={() => WithdrawMetamon('N', [120225], '1452558088259240448')}>WithdrawMetamon</Button>
      <Button onClick={() => getWalletAsset()}>getWalletAsset</Button>
    </div>
  );
}

export default App;