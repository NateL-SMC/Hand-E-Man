export const PRIORITY_FEE = 49; // charged when booking for today (tweak freely)
export const VAT_RATE = 0.12; // PH VAT

export function computeTotals(serviceCost: number, urgent: boolean) {
  const priorityFee = urgent ? PRIORITY_FEE : 0;
  const vat = Math.round((serviceCost + priorityFee) * VAT_RATE * 100) / 100;
  return { serviceCost, priorityFee, vat, total: serviceCost + priorityFee + vat };
}
