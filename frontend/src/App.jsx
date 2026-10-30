import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'

// Menü ve panel ayrı paketlere bölünür: müşterinin telefonu panel kodunu indirmez
const MenuPage = lazy(() => import('./menu/MenuRoute'))
const PanelRoutes = lazy(() => import('./panel/PanelRoutes'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/m/:slug" element={<MenuPage />} />
          <Route path="/panel/*" element={<PanelRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
