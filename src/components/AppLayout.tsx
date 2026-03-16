import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Tools", to: "/tools" },
];

export default function AppLayout() {
  return (
    <main className="page">
      <div className="container app-shell">
        <header className="site-header">
          <div>
            <p className="site-kicker">Bitcoin Dashboard</p>
            <h1 className="site-title">Dashboard und Tools in einer klaren Struktur</h1>
          </div>

          <nav className="site-nav" aria-label="Hauptnavigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <Outlet />
      </div>
    </main>
  );
}
