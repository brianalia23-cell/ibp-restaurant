// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SidebarLayoutV2 from "@/components/SidebarLayoutV2";

export const metadata: Metadata = {
  title: "IBP for Restaurants",
  description: "Integrated Business Planning for Restaurants & Cafes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SidebarLayoutV2>{children}</SidebarLayoutV2>
      </body>
    </html>
  );
}
