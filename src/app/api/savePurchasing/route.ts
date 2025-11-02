import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const savePath = path.join(process.cwd(), "src/data/purchasing.json");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2), "utf8");
    console.log("💾 purchasing.json updated");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving purchasing:", err);
    return NextResponse.json({ error: "Failed to save purchasing" }, { status: 500 });
  }
}
