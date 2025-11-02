import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Hist = { product: string; date: string; qty: number };
type Demand = { product: string; quantity: number };

const dataDir = path.join(process.cwd(), "src/data");
const historyPath = path.join(dataDir, "history_sales.json");
const demandPath = path.join(dataDir, "demand.json");

function readJSON<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
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
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const windowStr = url.searchParams.get("window") ?? "4";
    const windowParam = Number.isFinite(Number(windowStr)) ? Number(windowStr) : 4;
    const apply = (url.searchParams.get("apply") ?? "") === "1";

    const historyRaw = readJSON<unknown>(historyPath, []);
    const history: Hist[] = Array.isArray(historyRaw) ? (historyRaw as Hist[]) : [];

    if (history.length === 0) {
      return NextResponse.json({ error: "No history_sales.json data" }, { status: 400 });
    }

    // Agrupar por producto y ordenar por fecha asc
    const byProduct = history.reduce<Record<string, Hist[]>>((acc, r) => {
      const key = r?.product ?? "";
      if (!key) return acc;
      (acc[key] ??= []).push({
        product: key,
        date: r?.date ?? "",
        qty: Number.isFinite(Number(r?.qty)) ? Number(r.qty) : 0,
      });
      return acc;
    }, {});

    for (const p of Object.keys(byProduct)) {
        const rows = byProduct[p] ?? [];           // <- garantiza array
        rows.sort(
          (a, b) =>
            new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime()
        );
        byProduct[p] = rows;                       // <- reasignamos
      }
    // Promedio móvil simple
    const win = Math.max(1, windowParam);
    const forecast: Demand[] = Object.entries(byProduct).map(([product, rows]) => {
      const lastN = (rows ?? []).slice(-win);
      const avg =
        lastN.length > 0
          ? lastN.reduce((s, r) => s + (Number(r?.qty) || 0), 0) / lastN.length
          : 0;
      return { product, quantity: Math.max(0, Math.round(avg)) };
    });

    if (apply) {
      writeJSON(demandPath, forecast);
      console.log("♻️ Forecast applied → demand.json updated");
    }

    return NextResponse.json({ window: win, forecast, applied: apply });
  } catch (err) {
    console.error("❌ Error in /api/forecast:", err);
    return NextResponse.json({ error: "Forecast error" }, { status: 500 });
  }
}

/**
 * POST -> guarda histórico nuevo (sobrescribe).
 * Body: Hist[]
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array" }, { status: 400 });
    }
    const safeBody: Hist[] = body
      .filter(Boolean)
      .map((r: any) => ({
        product: String(r?.product ?? ""),
        date: String(r?.date ?? ""),
        qty: Number.isFinite(Number(r?.qty)) ? Number(r.qty) : 0,
      }))
      .filter((r) => r.product && r.date); // descartamos filas inválidas

    writeJSON(historyPath, safeBody);
    return NextResponse.json({ message: "history_sales.json saved", count: safeBody.length });
  } catch (err) {
    console.error("❌ Error saving history:", err);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}
