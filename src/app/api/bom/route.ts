import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Ingredient = { item: string; unit: string; quantity: number };
type ProductBOM = { product: string; ingredients: Ingredient[] };

const filePath = path.join(process.cwd(), "src/data/bom.json");

function readBOM(): ProductBOM[] {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveBOM(data: ProductBOM[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("💾 Saved bom.json");
}

// === GET ===
export async function GET() {
  const bom = readBOM();
  return NextResponse.json(bom);
}

// === POST ===
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductBOM[];
    const valid = Array.isArray(body)
      ? body.map((p) => ({
          product: String(p.product || ""),
          ingredients: Array.isArray(p.ingredients)
            ? p.ingredients.map((i) => ({
                item: String(i.item || ""),
                unit: String(i.unit || ""),
                quantity: Number(i.quantity) || 0,
              }))
            : [],
        }))
      : [];
    saveBOM(valid);
    return NextResponse.json({ ok: true, bom: valid });
  } catch (err) {
    console.error("❌ Error saving BOM:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
