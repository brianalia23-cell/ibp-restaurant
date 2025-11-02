import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const historyPath = path.join(dataDir, "purchase_orders_history.json");

function ensureHistoryFile() {
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
  }
}

export async function GET() {
  try {
    ensureHistoryFile();
    const raw = fs.readFileSync(historyPath, "utf-8");
    const list = JSON.parse(raw);

    // Ordenar por fecha (desc)
    const sorted = Array.isArray(list)
      ? [...list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : [];

    return new NextResponse(JSON.stringify(sorted), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // 🔥 Desactivar caché del lado de Next y del navegador
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("❌ Error in /api/purchase-orders-history:", err);
    return NextResponse.json(
      { error: "Failed to read purchase orders history" },
      { status: 500 }
    );
  }
}
