/**
 * Renders a JSON-LD block. Escapes `<` so a string in the data can never close
 * the script tag early — tour copy is operator-editable, which makes that a
 * real injection path, not a theoretical one.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
