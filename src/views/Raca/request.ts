import { RACA_SIGN_KEY, RACA_TOKEN_KEY } from '@/constants/storageKey'
import axios from 'axios'
import qs from 'qs'

const instance = axios.create()
instance.interceptors.request.use(config => {
  const accesstoken = localStorage.getItem(RACA_TOKEN_KEY)
  if (accesstoken) {
    if (!config.headers) {
      config.headers = { accesstoken }
    } else {
      config.headers.accesstoken = accesstoken
    }
  }
  return config
})

instance.interceptors.response.use(res => {
  if (res.data.code === 'FAIL') {
    if (res.data.result === 401) {
      localStorage.removeItem(RACA_SIGN_KEY)
      localStorage.removeItem(RACA_TOKEN_KEY)
      window.location.reload()
    }
  } else {
    return res.data
  }
  return res.data
})

export type RequestArgs = Record<string, string | number | boolean>

export function get<T = any>(url: string, params?: RequestArgs) {
  return instance({
    url,
    params,
  }) as unknown as Promise<T>
}

export function post<T = any>(url: string, data?: RequestArgs) {
  return instance({
    url,
    data,
    method: 'POST',
  }) as unknown as Promise<T>
}

export function formPost<T = any>(url: string, data: RequestArgs) {
  const postData = qs.stringify(data)
  return instance({
    method: 'POST',
    url,
    data: postData,
  }) as unknown as Promise<T>
}
