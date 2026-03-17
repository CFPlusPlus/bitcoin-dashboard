"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/Button";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Tools", href: "/tools" },
];

export default function SiteNavigation() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Hauptnavigation">
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
              "min-w-[8rem] flex-1 sm:flex-none"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
