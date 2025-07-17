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
      { path: 'test', component: () => import('pages/newFile.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
