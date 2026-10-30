import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../lib/auth'
import { ToastProvider } from './Toast'
import { LoginPage, RegisterPage } from './AuthPages'
import PanelLayout from './PanelLayout'
import BusinessList from './BusinessList'
import Overview from './Overview'
import CallsPage from './CallsPage'
import MenuEditor from './MenuEditor'
import TablesPage from './TablesPage'
import CommentsPage from './CommentsPage'
import SettingsPage from './SettingsPage'
import './panel.css'

export default function PanelRoutes() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="panel-root">
          <Routes>
            <Route path="giris" element={<LoginPage />} />
            <Route path="kayit" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route index element={<BusinessList />} />
              <Route path=":slug" element={<PanelLayout />}>
                <Route index element={<Overview />} />
                <Route path="cagrilar" element={<CallsPage />} />
                <Route path="menu" element={<MenuEditor />} />
                <Route path="masalar" element={<TablesPage />} />
                <Route path="yorumlar" element={<CommentsPage />} />
                <Route path="ayarlar" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </ToastProvider>
    </AuthProvider>
  )
}

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (user === undefined) return <p className="panel-loading">Oturum kontrol ediliyor…</p>
  if (!user) return <Navigate to="/panel/giris" replace state={{ from: location.pathname }} />
  return <Outlet />
}
