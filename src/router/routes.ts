import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'login',
    props: true,
    component: () => import('pages/Login.vue')
  },
  {
    path: '/agent',
    name: 'agent',
    props: true,
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'my-credentials', component: () => import('../js/pages/MyCredentials/index.vue') },
      { path: 'connections', component: () => import('../js/pages/Connections/index.vue') },
      { path: 'services', component: () => import('../js/pages/Services/index.vue') },
      { path: 'consents', component: () => import('../js/pages/Consents/index.vue') },
      { path: 'settings', component: () => import('../js/pages/Settings/index.vue') },
      { path: 'logout', component: () => import('../js/pages/Logout/index.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
