import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Hist = { product: string; date: string; qty: number };
type Demand = { product: string; quantity: number };

const dataDir = path.join(process.cwd(), "src/data");
const historyPath = path.join(dataDir, "history_sales.json");
const demandPath = path.join(dataDir, "demand.json");

function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return fallback; }
}
function writeJSON(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/**
 * GET -> calcula forecast con promedio móvil (window=4 por defecto)
 * Query:
 *  - window: número de periodos a promediar (opcional, default 4)
 *  - apply: "1" para guardar forecast en demand.json
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const windowParam = Number(url.searchParams.get("window") || "4");
    const apply = url.searchParams.get("apply") === "1";

    const history = readJSON<Hist[]>(historyPath, []);
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: "No history_sales.json data" }, { status: 400 });
    }

    // Agrupar por producto y ordenar por fecha asc
    const byProduct = history.reduce<Record<string, Hist[]>>((acc, r) => {
      acc[r.product] = acc[r.product] || [];
      acc[r.product].push(r);
      return acc;
    }, {});
    for (const p of Object.keys(byProduct)) {
      byProduct[p].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Promedio móvil simple
    const forecast: Demand[] = Object.entries(byProduct).map(([product, rows]) => {
      const lastN = rows.slice(-windowParam);
      const avg =
        lastN.length > 0
          ? lastN.reduce((s, r) => s + (Number(r.qty) || 0), 0) / lastN.length
          : 0;
      return { product, quantity: Math.max(0, Math.round(avg)) };
    });

    if (apply) {
      writeJSON(demandPath, forecast);
      console.log("♻️ Forecast applied → demand.json updated");
    }

    return NextResponse.json({ window: windowParam, forecast, applied: apply });
  } catch (err) {
    console.error("❌ Error in /api/forecast:", err);
    return NextResponse.json({ error: "Forecast error" }, { status: 500 });
  }
}

/**
 * POST -> guarda histórico nuevo (sobrescribe).
 * Body: Hist[]
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array" }, { status: 400 });
    }
    writeJSON(historyPath, body);
    return NextResponse.json({ message: "history_sales.json saved", count: body.length });
  } catch (err) {
    console.error("❌ Error saving history:", err);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}
