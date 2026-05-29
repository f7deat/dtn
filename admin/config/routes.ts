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
    path: '/event',
    name: 'event',
    icon: 'CalendarOutlined',
    routes: [
      {
        path: '/event',
        redirect: '/event/overview',
      },
      {
        path: '/event/overview',
        name: 'overview',
        component: './event',
        hideInMenu: true,
      },
      {
        path: '/event/center/:id',
        name: 'center',
        component: './event/center',
        hideInMenu: true
      }
    ]
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
    name: 'category',
    icon: 'AppstoreOutlined',
    path: '/category',
    component: './category'
  },
  {
    path: '/academic-year',
    name: 'academic-year',
    icon: 'ScheduleOutlined',
    routes: [
      {
        path: '/academic-year',
        redirect: '/academic-year/overview',
      },
      {
        path: '/academic-year/overview',
        name: 'overview',
        component: './academic-year',
        hideInMenu: true,
      },
      {
        path: '/academic-year/semester/:id',
        name: 'semester',
        component: './academic-year/semester',
        hideInMenu: true
      }
    ]
  },
  {
    path: '/semester',
    redirect: '/academic-year/overview',
    hideInMenu: true,
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
