"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./tab-bar.module.css";

type BadgeHref = "/messages" | "/idees";

const TABS = [
  { href: "/", icon: "🏠", label: "Accueil" },
  { href: "/messages", icon: "💬", label: "Messages" },
  { href: "/envies", icon: "🎁", label: "Envies" },
  { href: "/idees", icon: "💡", label: "Idées" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function TabBar({ badges = {} }: { badges?: Partial<Record<BadgeHref, number>> }) {
  const pathname = usePathname();
  return (
    <nav className={styles.bar} aria-label="Navigation">
      {TABS.map((tab) => {
        const badge = badges[tab.href as BadgeHref];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={styles.tab}
            aria-current={isActive(pathname, tab.href) ? "page" : undefined}
          >
            <span className={styles.icon} aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
            {badge ? <span className={styles.badge}>{badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
