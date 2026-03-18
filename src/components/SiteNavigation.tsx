"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/Button";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Werkzeuge", href: "/tools" },
];

export default function SiteNavigation() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center gap-2"
      aria-label="Hauptnavigation"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({
                active: isActive,
                intent: "secondary",
                size: "md",
              }),
              "min-w-[6.5rem] justify-center"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
