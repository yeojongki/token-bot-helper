import { getFromStorage } from '@/utils/storage'
import { userNamespace as namespace } from '@/constants/namespace'
import { PRIVATEKEY_KEY } from '@/constants/storageKey'

export function usePrivateKey() {
  return process.env.NODE_ENV === 'production'
    ? getFromStorage<string>(namespace, PRIVATEKEY_KEY) || ''
    : import.meta.env.VITE_PRIVATE_KEY
}
