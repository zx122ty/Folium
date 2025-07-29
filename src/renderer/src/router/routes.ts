import Layout from '@renderer/layout/index.vue'

export const AppRoutes = [
  { path: '/', redirect: '/base' },
  {
    path: '/base',
    name: 'layout',
    component: Layout,
    children: [
      {
        path: '',
        name: 'base-home',
        component: () => import('@renderer/views/Base/index.vue')
      }
    ]
  },
  {
    path: '/PdfViewer',
    name: 'PdfViewer',
    component: Layout,
    children: [
      {
        path: '',
        name: 'test-PdfViewer',
        component: () => import('@renderer/views/PdfViewer/index.vue'),
        props: (route: any) => ({ pdfUrl: route.query.pdfUrl })
      }
    ]
  },
  {
    path: '/test',
    name: 'test',
    component: Layout,
    children: [
      {
        path: '',
        name: 'test-viewer',
        component: () => import('@renderer/views/Test/index.vue'),
        props: (route: any) => ({ pdfUrl: route.query.pdfUrl })
      }
    ]
  }
]
