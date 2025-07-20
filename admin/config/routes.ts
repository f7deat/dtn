export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'DashboardOutlined',
    component: './dashboard',
  },
  {
    path: '/article',
    name: 'article',
    icon: 'FileTextOutlined',
    routes: [
      {
        path: '/article',
        redirect: '/article/overview',
      },
      {
        path: '/article/overview',
        name: 'overview',
        component: './article',
        hideInMenu: true,
      },
      {
        path: '/article/center/:id',
        name: 'center',
        component: './article/center',
        hideInMenu: true
      },
    ]
  },
  {
    path: '/student',
    name: 'student',
    icon: 'UserOutlined',
    component: './student'
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '404',
    layout: false,
    path: './*',
  },
];
