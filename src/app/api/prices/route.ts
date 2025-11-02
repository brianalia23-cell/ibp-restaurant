// src/app/api/prices/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const salesPath = path.join(process.cwd(), "src/data/prices_sales.json");
const purchasePath = path.join(process.cwd(), "src/data/prices_purchase.json");

export async function GET() {
  try {
    const sales = JSON.parse(fs.readFileSync(salesPath, "utf8"));
    const purchase = JSON.parse(fs.readFileSync(purchasePath, "utf8"));

    return NextResponse.json({ sales, purchase });
  } catch (error) {
    console.error("❌ Error loading price data:", error);
    return NextResponse.json({ error: "Error reading price files" }, { status: 500 });
  }
}
