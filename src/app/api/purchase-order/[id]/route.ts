// src/app/api/purchase-order/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getPurchaseOrderById,
  replacePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/lib/db/purchaseOrders";
import type { PurchaseOrder } from "@/types/purchaseOrder";

// Helpers de respuesta
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
function notFound(id: string) {
  return NextResponse.json({ error: `Purchase order ${id} not found` }, { status: 404 });
}
function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

// GET /api/purchase-order/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") return badRequest("Missing or invalid 'id' param");

  const po = await getPurchaseOrderById(id);
  if (!po) return notFound(id);

  return ok<PurchaseOrder>(po);
}

// PUT /api/purchase-order/[id]  (reemplaza completo)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") return badRequest("Missing or invalid 'id' param");

  let body: Partial<PurchaseOrder>;
  try {
    body = (await req.json()) as Partial<PurchaseOrder>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  body.id = id;
  const exists = await getPurchaseOrderById(id);
  if (!exists) return notFound(id);

  const updated = await replacePurchaseOrder(id, body as PurchaseOrder);
  return ok<PurchaseOrder>(updated);
}

// PATCH /api/purchase-order/[id]  (parcial)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") return badRequest("Missing or invalid 'id' param");

  let body: Partial<PurchaseOrder>;
  try {
    body = (await req.json()) as Partial<PurchaseOrder>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const exists = await getPurchaseOrderById(id);
  if (!exists) return notFound(id);

  const merged = await updatePurchaseOrder(id, body);
  return ok<PurchaseOrder>(merged);
}

// DELETE /api/purchase-order/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") return badRequest("Missing or invalid 'id' param");

  const exists = await getPurchaseOrderById(id);
  if (!exists) return notFound(id);

  await deletePurchaseOrder(id);
  return ok<{ ok: true }>({ ok: true }, { status: 200 });
}
