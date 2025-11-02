export type FixedCost = { label: string; amount: number };

export type PnL = {
  monthlySales: number;
  cogsPct: number;
  deliveryPct: number;
  fixed: FixedCost[];
};
