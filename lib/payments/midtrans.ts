import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Midtrans Snap integration (cards, QRIS, e-wallets, bank transfer).
 *
 * Sandbox and production are the same API on different hosts, so the System tab
 * only flips a boolean — the key itself never leaves Vercel's environment.
 */
export function midtransConfigured(): boolean {
  return (process.env.MIDTRANS_SERVER_KEY ?? "").trim().length > 0;
}

function baseUrl(sandbox: boolean): string {
  return sandbox ? "https://app.sandbox.midtrans.com" : "https://app.midtrans.com";
}

export type SnapItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type SnapResult =
  | { ok: true; token: string; redirectUrl: string }
  | { ok: false; error: string };

export async function createSnapTransaction(input: {
  orderId: string;
  amount: number;
  sandbox: boolean;
  customer: { name: string; email?: string; phone?: string };
  items: SnapItem[];
  finishUrl?: string;
}): Promise<SnapResult> {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();

  if (!serverKey) {
    return { ok: false, error: "MIDTRANS_SERVER_KEY is not set in Vercel." };
  }

  try {
    const response = await fetch(`${baseUrl(input.sandbox)}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.orderId,
          gross_amount: Math.round(input.amount),
        },
        item_details: input.items.map((item) => ({
          id: item.id.slice(0, 50),
          name: item.name.slice(0, 50),
          price: Math.round(item.price),
          quantity: item.quantity,
        })),
        customer_details: {
          first_name: input.customer.name.slice(0, 50),
          email: input.customer.email || undefined,
          phone: input.customer.phone || undefined,
        },
        ...(input.finishUrl ? { callbacks: { finish: input.finishUrl } } : {}),
        credit_card: { secure: true },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !body.token || !body.redirect_url) {
      const detail = body.error_messages?.join("; ") ?? `Midtrans returned ${response.status}`;
      return { ok: false, error: detail };
    }

    return { ok: true, token: body.token, redirectUrl: body.redirect_url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Midtrans request failed" };
  }
}

/**
 * Midtrans signs each notification with
 * sha512(order_id + status_code + gross_amount + server_key).
 */
export function verifyNotificationSignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}): boolean {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();

  if (
    !serverKey ||
    !payload.order_id ||
    !payload.status_code ||
    !payload.gross_amount ||
    !payload.signature_key
  ) {
    return false;
  }

  const expected = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");
  const provided = payload.signature_key.toLowerCase();

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export type MappedStatus = {
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  bookingPaymentStatus: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
};

/** Midtrans transaction_status → our payment status vocabulary. */
export function mapTransactionStatus(status: string): MappedStatus | null {
  switch (status) {
    case "settlement":
    case "capture":
      return { paymentStatus: "PAID", bookingPaymentStatus: "PAID" };
    case "pending":
      return { paymentStatus: "PENDING", bookingPaymentStatus: "PENDING" };
    case "deny":
    case "cancel":
    case "expire":
    case "failure":
      return { paymentStatus: "FAILED", bookingPaymentStatus: "FAILED" };
    case "refund":
    case "partial_refund":
      return { paymentStatus: "REFUNDED", bookingPaymentStatus: "REFUNDED" };
    default:
      return null;
  }
}
