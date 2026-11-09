import { getSessionUser } from "@/lib/auth";
import { sql } from "@/lib/db";

function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

/** CSV of bookings, honouring the same filters as the list page. */
export async function GET(request: Request): Promise<Response> {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return new Response("Not authorised", { status: 401 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const q = url.searchParams.get("q");

  const filters = [sql`true`];

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    filters.push(sql`b.booking_date = ${date}::date`);
  }

  if (status && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
    filters.push(sql`b.status = ${status}`);
  }

  if (source && ["ONLINE", "POS", "WHATSAPP"].includes(source)) {
    filters.push(sql`b.source = ${source}`);
  }

  if (q) {
    const term = `%${q}%`;
    filters.push(sql`(
      b.code ilike ${term} or b.guest_name ilike ${term} or
      b.guest_email ilike ${term} or b.guest_phone ilike ${term}
    )`);
  }

  const where = filters.reduce((accumulator, filter) => sql`${accumulator} and ${filter}`);

  const rows = await sql<
    {
      code: string;
      created_at: string;
      booking_date: string;
      departure_time: string;
      tour_name: string;
      adults: number;
      children: number;
      total_amount: number;
      status: string;
      source: string;
      payment_status: string;
      payment_method: string;
      guest_name: string;
      guest_email: string;
      guest_phone: string;
      hotel: string;
      notes: string;
    }[]
  >`
    select b.code, b.created_at::text as created_at, b.booking_date::text as booking_date,
           b.departure_time, t.name as tour_name, b.adults, b.children, b.total_amount,
           b.status, b.source, b.payment_status, b.payment_method, b.guest_name,
           b.guest_email, b.guest_phone, b.hotel, b.notes
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    where ${where}
    order by b.booking_date desc, b.created_at desc
  `;

  const header = [
    "Code",
    "Created",
    "Date",
    "Departure",
    "Tour",
    "Adults",
    "Children",
    "Total IDR",
    "Status",
    "Source",
    "Payment status",
    "Payment method",
    "Guest",
    "Email",
    "Phone",
    "Hotel",
    "Notes",
  ];

  const body = rows.map((row) =>
    [
      row.code,
      row.created_at,
      row.booking_date,
      row.departure_time,
      row.tour_name,
      row.adults,
      row.children,
      row.total_amount,
      row.status,
      row.source,
      row.payment_status,
      row.payment_method,
      row.guest_name,
      row.guest_email,
      row.guest_phone,
      row.hotel,
      row.notes,
    ]
      .map(cell)
      .join(","),
  );

  const csv = [header.map(cell).join(","), ...body].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="telaga-booking-${date ?? "all"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
