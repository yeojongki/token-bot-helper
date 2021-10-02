import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/bnx',
    component: () => import('@/views/Bnx/index.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
