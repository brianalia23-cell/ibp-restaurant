import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const bomPath = path.join(dataDir, "bom.json");

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
  const bom = readJSON<any[]>(bomPath, []);
  return NextResponse.json(bom);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product, ingredients } = body;
    if (!product || !Array.isArray(ingredients))
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const bom = readJSON<any[]>(bomPath, []);
    const existing = bom.findIndex((r) => r.product === product);
    if (existing >= 0) bom[existing] = { product, ingredients };
    else bom.push({ product, ingredients });

    writeJSON(bomPath, bom);
    return NextResponse.json({ ok: true, count: bom.length });
  } catch (e) {
    console.error("Error in /api/recipes:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
