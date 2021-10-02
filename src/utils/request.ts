export default function request(url: string, data: object, method = 'POST') {
  return fetch(url, { method, body: JSON.stringify(data) }).then((res) =>
    res.json(),
  )
}
