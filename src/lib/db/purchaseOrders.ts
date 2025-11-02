// src/lib/db/purchaseOrders.ts
import { PurchaseOrder } from "@/types/purchaseOrder";

const store = new Map<string, PurchaseOrder>();

function nowISO() {
  return new Date().toISOString();
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  return store.get(id) ?? null;
}

export async function replacePurchaseOrder(id: string, po: PurchaseOrder): Promise<PurchaseOrder> {
  const current = store.get(id);
  const base: PurchaseOrder = current ?? { id, createdAt: nowISO() };
  const replaced: PurchaseOrder = { ...base, ...po, id, updatedAt: nowISO() };
  store.set(id, replaced);
  return replaced;
}

export async function updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const current = store.get(id) ?? { id, createdAt: nowISO() };
  const merged: PurchaseOrder = { ...current, ...patch, id, updatedAt: nowISO() };
  store.set(id, merged);
  return merged;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  store.delete(id);
}
