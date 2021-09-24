const prefix = 'TOKEN_BOT_YEOJONGKI'

export function setToStorage(namespace: string, key: string, value: any) {
  window.localStorage.setItem(
    `${prefix}-${namespace}-${key}`,
    JSON.stringify(value),
  )
}

export function removeFromStorage(namespace: string, key: string) {
  window.localStorage.removeItem(`${prefix}-${namespace}-${key}`)
}

export function getFromStorage<T>(namespace: string, key: string): T | null {
  try {
    const str = localStorage.getItem(`${prefix}-${namespace}-${key}`)
    if (str) {
      return JSON.parse(str) as T
    }

    return null
  } catch (error) {
    return null
  }
}
