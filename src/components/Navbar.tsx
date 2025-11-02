// src/components/Navbar.tsx
export default function Navbar() {
    return (
      <nav className="flex gap-4 p-4 bg-gray-100 border-b">
        <a href="/" className="font-semibold">Dashboard</a>
        <a href="/demand" className="hover:underline">Demand</a>
        <a href="/purchasing" className="hover:underline">Purchasing</a>
        <a href="/pnl" className="hover:underline">P&L</a>
        <a href="/pricing" className="hover:underline">Pricing</a>
        <a href="/inventory" className="hover:underline text-blue-700 font-medium">Inventory</a>
      </nav>
    );
  }
  