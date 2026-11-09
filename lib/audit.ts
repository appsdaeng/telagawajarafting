import { sql } from "@/lib/db";

/**
 * Append-only trail of the changes that matter: who confirmed a booking, who
 * voided a sale, who edited a tour, who changed staff access.
 */
export async function writeAudit(input: {
  actorId: string | null;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await sql`
      insert into public.audit_log (actor_id, actor_email, action, entity, entity_id, meta)
      values (
        ${input.actorId},
        ${input.actorEmail},
        ${input.action},
        ${input.entity},
        ${input.entityId ?? ""},
        ${sql.json((input.meta ?? {}) as never)}
      )
    `;
  } catch {
    /* auditing must never break the operation it describes */
  }
}
