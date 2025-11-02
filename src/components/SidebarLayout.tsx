"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🧠 Debug visual — para confirmar que se carga el nuevo sidebar
  useEffect(() => {
    console.log("✅ SidebarLayout loaded with enhanced menu");
  }, []);

  const links = [
    { href: "/", label: "🏠 Dashboard" },
    { href: "/pnl", label: "💰 P&L" },
    { href: "/pricing", label: "💵 Pricing" },
    { href: "/forecast", label: "📊 Forecast" },
    { href: "/demand", label: "📈 Demand" },
    { href: "/purchasing", label: "🛒 Purchasing" },
    { href: "/inventory", label: "📦 Inventory" },
    { href: "/purchase-orders/history", label: "🧾 Purchase Orders" },
    { href: "/catalog", label: "📖 Catalog / Recipes" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-5 flex flex-col shadow-sm">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-800">IBP for Restaurants</h1>
          <p className="text-xs text-gray-500">Integrated Business Planning</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-sm flex-1">
          {links.map(({ href, label }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`block rounded-md px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <footer className="mt-auto text-xs text-gray-400 border-t pt-3">
          <p>v0.2 — IBP System</p>
          <p className="mt-1">© 2025</p>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}