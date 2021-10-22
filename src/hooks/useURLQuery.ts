import { useRoute } from 'vue-router'

export const useRouteQuery = () => {
  const route = useRoute()
  return route.query
}
