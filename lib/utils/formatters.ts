import { format, isValid } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatQty(qty: number): string {
  return quantityFormatter.format(qty);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);

  return isValid(date) ? format(date, "MMM d, yyyy, h:mm a") : "-";
}
