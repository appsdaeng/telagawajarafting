/**
 * Discount codes for online payment.
 *
 * A coupon is only for prepaid bookings: it cannot be combined with cash on
 * arrival, and a discounted booking is non-refundable (it can be rescheduled).
 * The checkout page and /api/bookings both read this table, so the price the
 * guest sees on the checkout page is the price that is charged.
 */
export type Coupon = {
  code: string;
  percent: number;
};

const COUPONS: Coupon[] = [{ code: "TWR10", percent: 10 }];

/** The coupon for a code the guest typed, or null when it is not valid. */
export function findCoupon(value: string): Coupon | null {
  const code = value.trim().toUpperCase();

  if (!code) {
    return null;
  }

  return COUPONS.find((coupon) => coupon.code === code) ?? null;
}

/** The rupiah taken off an amount, rounded to the nearest rupiah. */
export function discountFor(amount: number, coupon: Coupon | null): number {
  if (!coupon || amount <= 0) {
    return 0;
  }

  return Math.round((amount * coupon.percent) / 100);
}

/** The payment methods the checkout page offers. */
export const PAYMENT_METHODS = [
  { id: "card", label: "Card", hint: "Visa, Mastercard, JCB" },
  { id: "paypal", label: "PayPal", hint: "Pay with your PayPal account" },
  { id: "qr", label: "QR", hint: "Scan with your banking app (QRIS)" },
  { id: "ewallet", label: "E-wallet", hint: "GoPay, OVO, DANA, ShopeePay" },
  { id: "googlepay", label: "Google Pay", hint: "Fast checkout" },
  { id: "applepay", label: "Apple Pay", hint: "Fast checkout" },
  { id: "cash", label: "Cash on arrival", hint: "Pay in cash when you meet us at the venue." },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function isPaymentMethod(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((method) => method.id === value);
}
