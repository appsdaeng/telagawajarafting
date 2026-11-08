import type { Faq } from "@/lib/content";

/**
 * Native <details> accordion: works without JavaScript, is keyboard accessible
 * and keeps the answer text in the HTML so it is indexed. A JS accordion that
 * mounts answers on click would hide the content from Google.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-river-100 border-y border-river-100">
      {items.map((item) => (
        <details key={item.question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left font-semibold tracking-tight text-river-950 marker:hidden [&::-webkit-details-marker]:hidden">
            <h3 className="text-base">{item.question}</h3>
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-river-200 text-river-600 transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-river-800">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
