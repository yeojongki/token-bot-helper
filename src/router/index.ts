import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/bnx',
    redirect: '/bnx/working'
  },
  {
    path: '/bnx/working',
    component: () => import('@/views/Bnx/Working.vue'),
  },
  {
    path: '/bnx/marketing',
    component: () => import('@/views/Bnx/Marketing.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
