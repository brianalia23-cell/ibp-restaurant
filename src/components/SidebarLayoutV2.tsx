"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

type NavItem = { href: string; label: string };
type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: "Catalog",
    items: [
      { href: "/catalog", label: "📚 Catalog" },
      { href: "/recipes", label: "👩‍🍳 Recipes" },
    ],
  },
  {
    title: "Commercial",
    items: [
      { href: "/sales", label: "💵 Pricing / Sales" },      // redirige a /pricing por ahora
      { href: "/forecast", label: "📊 Forecast / Demand" }, // redirige a /demand por ahora
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/", label: "🏠 Dashboard" },
      { href: "/purchasing", label: "🛒 Purchasing" },
      { href: "/inventory", label: "📦 Inventory" },
      { href: "/pnl", label: "💰 P&L" },
      { href: "/purchase-orders/history", label: "🧾 Purchase Orders" },
    ],
  },
];

export default function SidebarLayoutV2({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-64 shrink-0 border-r bg-white p-5 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">IBP for Restaurants</h1>
          <p className="text-xs text-gray-500">Integrated Business Planning</p>
        </div>

        <nav className="space-y-5 text-sm flex-1">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-3 pb-1 text-[11px] uppercase tracking-wide text-gray-400">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`block rounded-md px-3 py-2 transition-colors ${
                      isActive(href)
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <footer className="mt-auto text-xs text-gray-400 border-t pt-3">
          <p>v0.2 — IBP System</p>
          <p className="mt-1">© 2025</p>
        </footer>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
