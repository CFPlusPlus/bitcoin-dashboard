import { useEffect, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Link, NavLink, Route, Routes, matchPath, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import Overview from '@/pages/overview'
import Market from '@/pages/market'
import Blockchain from '@/pages/blockchain'
import Mining from '@/pages/mining'

const navigation = [
  { to: '/', label: 'Übersicht' },
  { to: '/market', label: 'Markt' },
  { to: '/blockchain', label: 'Blockchain' },
  { to: '/mining', label: 'Netzwerk & Mining' },
]

function RouteAccessibility() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    const title =
      navigation.find(({ to }) => matchPath({ path: to, end: true }, pathname))?.label ??
      'Seite nicht gefunden'
    document.title = `${title} · Bitcoin Dashboard`
    if (previousPath.current !== pathname) {
      const destination =
        document.querySelector<HTMLElement>('#main h1') ?? document.getElementById('main')
      destination?.focus()
      previousPath.current = pathname
      // Native history traversal can restore #main after React's effect.
      // Reapply the route heading on the next frame, and cancel on a rapid navigation.
      if (typeof requestAnimationFrame === 'function') {
        const frame = requestAnimationFrame(() => destination?.focus({ preventScroll: true }))
        return () => cancelAnimationFrame(frame)
      }
    }
  }, [pathname])
  return null
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  return (
    <div className="app-shell">
      <RouteAccessibility />
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <div className="shell-container">
        <header className="site-header">
          <Link to="/" aria-label="Bitcoin Dashboard – Übersicht" className="wordmark">
            <span className="wordmark-symbol" aria-hidden="true">
              ₿
            </span>
            <span>
              bitcoin<span className="wordmark-suffix"> / dashboard</span>
            </span>
          </Link>
          <nav aria-label="Hauptnavigation" className="navigation">
            {navigation.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} aria-label={label}>
                {to === '/mining' ? (
                  <span>
                    Netzwerk<span className="nav-detail"> &amp; Mining</span>
                  </span>
                ) : (
                  label
                )}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </header>
      </div>
      <main id="main" tabIndex={-1} className="shell-container main-content">
        <ErrorBoundary key={location.key} scope="view">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/market" element={<Market />} />
            <Route path="/blockchain" element={<Blockchain />} />
            <Route path="/mining" element={<Mining />} />
            <Route
              path="*"
              element={
                <div className="py-20 text-center">
                  <h1 tabIndex={-1} className="page-title mb-4">
                    Seite nicht gefunden
                  </h1>
                  <Button asChild>
                    <Link to="/">Zur Übersicht</Link>
                  </Button>
                </div>
              }
            />
          </Routes>
        </ErrorBoundary>
      </main>
      <div className="shell-container">
        <footer className="site-footer">
          <span>
            Bitcoin Dashboard <span aria-hidden="true">/</span> Analytical
          </span>
          <span>Blockchain: mempool.space · Weitere Bereiche als Vorschau gekennzeichnet.</span>
        </footer>
      </div>
    </div>
  )
}
