import qs from 'qs'

export default function request(url: string, data: object, method = 'POST') {
  return fetch(url, { method, body: JSON.stringify(data) }).then((res) =>
    res.json(),
  )
}

export function get(url: string, params: Object) {
  const query = qs.stringify(params)
  return fetch(`${url}?${query}`, { method: 'GET' }).then((res) => res.json())
}
