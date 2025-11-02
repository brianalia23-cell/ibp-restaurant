import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const dataDir = path.join(process.cwd(), "src/data");

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "pdf";

  const orderPath = path.join(dataDir, "purchase_order.json");
  if (!fs.existsSync(orderPath)) {
    return NextResponse.json({ error: "No purchase order found" }, { status: 404 });
  }

  const order = readJSON<any>(orderPath, null);
  if (!order) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  // ✅ CSV export
  if (format === "csv") {
    const header = "Item,Unit,Quantity,Unit Cost,Total Cost\n";
    const rows = order.items
      .map(
        (i: any) =>
          `${i.item},${i.unit},${i.quantity},${i.unitCost},${i.totalCost}`
      )
      .join("\n");
    const csv = `${header}${rows}\n\nTotal Items:,${order.totalItems}\nTotal Order Value:,${order.totalOrderValue}`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=purchase-order-${id}.csv`,
      },
    });
  }

  // ✅ PDF export
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();

  page.drawText(`Purchase Order — ${id}`, {
    x: 50,
    y: height - 50,
    size: 20,
    font,
    color: rgb(0, 0.2, 0.6),
  });

  let y = height - 100;
  const lineHeight = 14;

  const drawLine = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y, size, font });
    y -= lineHeight;
    if (y < 50) {
      page = pdfDoc.addPage([600, 800]);
      y = page.getSize().height - 50;
    }
  };

  drawLine(`Date: ${new Date(order.date).toLocaleDateString()}`);
  drawLine(`Total Items: ${order.totalItems}`);
  drawLine(`Total Order Value: $${order.totalOrderValue.toFixed(2)}`);
  y -= 10;
  drawLine("Items:", 14);
  y -= 5;

  order.items.forEach((item: any, index: number) => {
    drawLine(
      `${index + 1}. ${item.item} — ${item.quantity} ${item.unit} @ $${item.unitCost.toFixed(
        2
      )} = $${item.totalCost.toFixed(2)}`,
      10
    );
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=purchase-order-${id}.pdf`,
    },
  });
}
