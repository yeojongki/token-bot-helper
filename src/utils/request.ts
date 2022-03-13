import qs from 'qs'

export default function request(url: string, data: object, method = 'POST') {
  return fetch(url, { method, body: JSON.stringify(data) }).then(res =>
    res.json(),
  )
}

export function formPost<T = any>(
  url: string,
  data: Record<string, any>,
  headers?: HeadersInit,
): Promise<T> {
  const fd = new FormData()
  Object.keys(data).forEach(key => {
    fd.append(key, data[key])
  })

  return fetch(url, { method: 'POST', body: fd, headers }).then(res =>
    res.json(),
  )
}

export function get(url: string, params?: Object) {
  const _url = params ? `${url}?${qs.stringify(params)}` : url
  return fetch(_url, { method: 'GET' }).then(res => res.json())
}
