import { Bitcoin, Moon, Sun } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import Overview from '@/pages/overview'
import Market from '@/pages/market'
import Blockchain from '@/pages/blockchain'
import Mining from '@/pages/mining'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  return <><a href="#main" className="skip-link">Zum Inhalt springen</a><header className="border-b border-border bg-card"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 px-4 py-3 md:px-8">
    <Link to="/" aria-label="Bitcoin Dashboard – Übersicht" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bitcoin size={22} /></span><span>Bitcoin<span className="ml-1 font-normal text-muted-foreground">Dashboard</span></span></Link>
    <nav aria-label="Hauptnavigation" className="order-3 -mb-3 mt-3 flex w-full gap-5 overflow-x-auto md:order-none md:m-0 md:w-auto md:gap-6">{[['/', 'Übersicht'], ['/market', 'Markt'], ['/blockchain', 'Blockchain'], ['/mining', 'Netzwerk & Mining']].map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `whitespace-nowrap border-b-2 py-3 text-sm font-medium ${isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</NavLink>)}</nav>
    <Button variant="outline" size="icon" className="ml-auto" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
  </div></header><main id="main" tabIndex={-1} className="mx-auto min-h-[calc(100vh-150px)] max-w-[1600px] px-4 py-7 outline-none md:px-8 md:py-8"><Routes><Route path="/" element={<Overview />} /><Route path="/market" element={<Market />} /><Route path="/blockchain" element={<Blockchain />} /><Route path="/mining" element={<Mining />} /><Route path="*" element={<div className="py-20 text-center"><h1 className="mb-4 text-2xl font-semibold">Seite nicht gefunden</h1><Button asChild><Link to="/">Zur Übersicht</Link></Button></div>} /></Routes></main><footer className="mx-auto flex max-w-[1600px] flex-wrap justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:px-8"><span>Bitcoin Dashboard · Initiale Vorschau</span><span>Alle Kennzahlen sind Platzhalter. Keine Live-Daten.</span></footer></>
}
