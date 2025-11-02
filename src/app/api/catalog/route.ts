import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Product = {
  sku: string;
  name: string;
  category?: string;
  isActive?: boolean;
};

const dataDir = path.join(process.cwd(), "src/data");
const filePath = path.join(dataDir, "catalog.json");

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readJSON<Product[]>(filePath, []);
  return NextResponse.json({ items: data });
}

/**
 * POST admite:
 *  - un único producto { sku, name, ... }  -> upsert por sku
 *  - un array de productos                 -> merge/upsert por sku
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incoming: Product[] = Array.isArray(body) ? body : [body];

    let current = readJSON<Product[]>(filePath, []);

    // Upsert por sku
    for (const p of incoming) {
      if (!p.sku || !p.name) continue;
      const idx = current.findIndex((c) => c.sku === p.sku);
      if (idx >= 0) current[idx] = { ...current[idx], ...p };
      else current.push({ isActive: true, ...p });
    }

    writeJSON(filePath, current);
    return NextResponse.json({ ok: true, count: incoming.length });
  } catch (err) {
    console.error("❌ /api/catalog POST error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
