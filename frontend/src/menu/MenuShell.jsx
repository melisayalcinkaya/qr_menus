import { Route, Routes } from 'react-router-dom'
import { MenuProvider, useMenu } from './MenuContext'
import MenuSheets from './MenuSheets'
import * as Klasik from './themes/Klasik'
import * as Bistro from './themes/Bistro'
import * as Vitrin from './themes/Vitrin'
import './menu-base.css'

const THEME_VIEWS = { klasik: Klasik, bistro: Bistro, vitrin: Vitrin }

export default function MenuShell() {
  return (
    <MenuProvider>
      <MenuScreens />
    </MenuProvider>
  )
}

function MenuScreens() {
  const { menu, data, t, theme } = useMenu()
  const View = THEME_VIEWS[theme] || Klasik

  if (!data) {
    const missing = menu.error?.status === 404
    return (
      <div className={`menu theme-${theme} menu-state`} aria-busy={!menu.error}>
        {menu.error ? (
          <div role="alert">
            <p>{missing ? t.notFound : menu.error.message}</p>
            {!missing && (
              <button type="button" className="menu-state__retry" onClick={menu.reload}>
                {t.retry}
              </button>
            )}
          </div>
        ) : (
          <p>{t.loading}…</p>
        )}
      </div>
    )
  }

  return (
    <div className={`menu theme-${theme}`}>
      <Routes>
        <Route index element={<View.Home />} />
        <Route path="k/:categoryId" element={<View.CategoryPage />} />
        <Route path="*" element={<View.Home />} />
      </Routes>
      <MenuSheets />
    </div>
  )
}
