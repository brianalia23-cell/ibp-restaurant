// src/types/purchaseOrder.ts
import type { UUID } from "./catalog"; // ✅ Usamos el UUID ya definido en catalog

export interface PurchaseOrderItem {
  productId: UUID;
  qty: number;
  unitPrice?: number;
}

export type PurchaseOrderStatus =
  | "draft"
  | "approved"
  | "received"
  | "cancelled";

export interface PurchaseOrder {
  id: UUID;
  supplierId?: UUID;
  status?: PurchaseOrderStatus;
  items?: PurchaseOrderItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
