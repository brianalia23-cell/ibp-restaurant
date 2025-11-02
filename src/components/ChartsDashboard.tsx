"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ChartsDashboard({ data }: { data: any }) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Evita el warning de Recharts por width(-1) y height(-1)
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("The width(-1) and height(-1)")
      ) {
        return; // silencia SOLO ese warning
      }
      originalWarn(...args);
    };

    const id = requestAnimationFrame(() => setReady(true));
    return () => {
      cancelAnimationFrame(id);
      console.warn = originalWarn;
    };
  }, []);

  if (!ready || !data) {
    return <div className="text-gray-500 mt-6">Loading chart...</div>;
  }

  const chartData = [
    { name: "Sales", value: Number(data.monthlySales) || 0 },
    { name: "Materials", value: Number(data.materialsCost) || 0 },
    { name: "Fixed", value: Number(data.fixedTotal) || 0 },
    { name: "Profit", value: Number(data.netProfit) || 0 },
  ];

  console.log("📊 Rendering chart with data:", chartData);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border bg-white p-6 shadow-sm mt-6"
    >
      <h2 className="mb-3 text-lg font-semibold text-gray-800">
        📊 Financial Overview
      </h2>

      <div className="relative w-full h-[360px] min-w-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={50}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis />
            <Tooltip
              formatter={(v: number) => `$${v.toLocaleString()}`}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
