import qs from 'qs'

export default function request(url: string, data: object, method = 'POST') {
  return fetch(url, { method, body: JSON.stringify(data) }).then(res =>
    res.json(),
  )
}

export function get(url: string, params?: Object) {
  const _url = params ? `${url}?${qs.stringify(params)}` : url
  return fetch(_url, { method: 'GET' }).then(res => res.json())
}
