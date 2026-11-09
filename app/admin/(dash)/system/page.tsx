import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  getNotificationSettings,
  getPaymentSettings,
} from "@/lib/settings";
import {
  Badge,
  Card,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import {
  saveNotificationSettingsAction,
  savePaymentSettingsAction,
  testEmailAction,
} from "../actions";

export const metadata: Metadata = { title: "System" };

type EmailRow = {
  id: string;
  kind: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: string;
  error: string;
  created_at: string;
};

const env = (key: string) => (process.env[key] ?? "").trim().length > 0;

export default async function SystemPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tested?: string; error?: string }>;
}) {
  await requireAdmin();
  const { saved, tested, error } = await searchParams;
  const payments = await getPaymentSettings();
  const notifications = await getNotificationSettings();

  const emails = await sql<EmailRow[]>`
    select id, kind, to_email, from_email, subject, status, error, created_at::text as created_at
    from public.email_log
    order by created_at desc
    limit 12
  `;

  const midtransKey = env("MIDTRANS_SERVER_KEY");
  const emailKey = env("RESEND_API_KEY") || env("SENDGRID_API_KEY");

  return (
    <div className="space-y-5">
      <PageHeader
        title="System"
        description="Payment gateway and email. Keys live in Vercel environment variables — this page only switches behaviour on and off."
      />

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {tested ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Test email accepted by the provider. Check the inbox and the log below.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Environment</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-center justify-between gap-2">
            <span>DATABASE_URL</span>
            <Badge tone={env("DATABASE_URL") ? "green" : "red"}>
              {env("DATABASE_URL") ? "set" : "missing"}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>AUTH_SECRET (32+ chars)</span>
            <Badge tone={(process.env.AUTH_SECRET ?? "").length >= 32 ? "green" : "red"}>
              {(process.env.AUTH_SECRET ?? "").length >= 32 ? "set" : "missing"}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>RESEND_API_KEY / SENDGRID_API_KEY</span>
            <Badge tone={emailKey ? "green" : "amber"}>{emailKey ? "set" : "missing"}</Badge>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>MIDTRANS_SERVER_KEY</span>
            <Badge tone={midtransKey ? "green" : "amber"}>
              {midtransKey ? "set" : "missing"}
            </Badge>
          </li>
        </ul>
        <p className="mt-3 text-xs text-river-500">
          Values are never displayed or logged. Add or rotate them in Vercel → Settings →
          Environment Variables, then redeploy.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Payment gateway</h2>
          <p className="mt-1 text-xs text-river-500">
            Midtrans Snap: cards, QRIS, e-wallets and bank transfer. Sandbox charges nothing real.
          </p>

          {payments.gatewayEnabled && !midtransKey ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The gateway is switched on but MIDTRANS_SERVER_KEY is missing, so online bookings fall
              back to pay-on-arrival.
            </p>
          ) : null}

          <form action={savePaymentSettingsAction} className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="gatewayEnabled" defaultChecked={payments.gatewayEnabled} />
              Accept online payments through the gateway
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sandbox" defaultChecked={payments.sandbox} />
              Sandbox mode
            </label>
            <label className="block">
              <span className={labelClass}>Deposit percent (0 = pay in full)</span>
              <input
                name="depositPercent"
                type="number"
                min="0"
                max="100"
                defaultValue={payments.depositPercent}
                className={inputClass}
              />
            </label>
            <button type="submit" className={buttonPrimary}>
              Save payment settings
            </button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Email notifications</h2>
          <p className="mt-1 text-xs text-river-500">
            Resend is used when RESEND_API_KEY is set; SendGrid works as a fallback. Sender addresses
            must be verified with the provider.
          </p>

          {!emailKey ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No provider key yet. Notifications are logged as “skipped” instead of failing
              silently.
            </p>
          ) : null}

          <form action={saveNotificationSettingsAction} className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="sendgridEnabled"
                defaultChecked={notifications.sendgridEnabled}
              />
              Email notifications enabled
            </label>

            <label className="block">
              <span className={labelClass}>New bookings — from</span>
              <input
                name="bookingFrom"
                type="email"
                defaultValue={notifications.bookingFrom}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Cancellations — from</span>
              <input
                name="cancelFrom"
                type="email"
                defaultValue={notifications.cancelFrom}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Payments — from</span>
              <input
                name="financeFrom"
                type="email"
                defaultValue={notifications.financeFrom}
                className={inputClass}
              />
            </label>

            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifyBooking" defaultChecked={notifications.notifyBooking} />
                Bookings
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifyCancel" defaultChecked={notifications.notifyCancel} />
                Cancellations
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifyPayment" defaultChecked={notifications.notifyPayment} />
                Payments
              </label>
            </div>

            <button type="submit" className={buttonPrimary}>
              Save email settings
            </button>
          </form>

          <form
            action={testEmailAction}
            className="mt-4 flex flex-wrap items-end gap-2 border-t border-river-100 pt-3"
          >
            <label className="block">
              <span className={labelClass}>Send a test to</span>
              <input name="to" type="email" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>As</span>
              <select name="kind" className={inputClass} defaultValue="booking">
                <option value="booking">booking@</option>
                <option value="cancellation">cancel@</option>
                <option value="payment">finance@</option>
              </select>
            </label>
            <button type="submit" className={buttonSecondary}>
              Send test
            </button>
          </form>
        </Card>
      </div>

      <Card className="p-0">
        <h2 className="border-b border-river-100 px-4 py-3 text-sm font-semibold">
          Recent email attempts
        </h2>
        {emails.length === 0 ? (
          <p className="px-4 py-6 text-sm text-river-500">Nothing sent yet.</p>
        ) : (
          <ul className="divide-y divide-river-50 text-xs">
            {emails.map((email) => (
              <li key={email.id} className="px-4 py-2">
                <span className="text-river-500">{email.created_at.slice(0, 16)}</span> ·{" "}
                <span className="uppercase">{email.kind}</span> · {email.from_email} →{" "}
                {email.to_email} ·{" "}
                <Badge
                  tone={
                    email.status === "sent"
                      ? "green"
                      : email.status === "failed"
                        ? "red"
                        : "amber"
                  }
                >
                  {email.status}
                </Badge>
                {email.error ? (
                  <span className="block text-red-600">{email.error}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export const instant = false;
