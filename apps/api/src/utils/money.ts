const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});

export function formatPaise(amountPaise: number | string): string {
  return inrFormatter.format(Number(amountPaise) / 100);
}

export function toPaise(value: number): number {
  return Math.round(value * 100);
}
