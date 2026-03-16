"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Tools", href: "/tools" },
];

export default function SiteNavigation() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="site-nav" aria-label="Hauptnavigation">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
