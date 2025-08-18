const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'signup', component: () => import('pages/SignUp.vue') },
      { path: 'login', component: () => import('pages/UserLogin.vue') },
      { path: 'profile', component: () => import('pages/UserProfile.vue') },
      { path: 'home', component: () => import('pages/homePage.vue') },
      { path: 'forgetPass', component: () => import('pages/ForgetPass.vue') },
      { path: 'itemDetail/:id', component: () => import('pages/itemDetail.vue') },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes