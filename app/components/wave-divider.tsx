/**
 * Water-splash decorations for the public site.
 *
 * `WaveDivider` is an absolutely positioned SVG that sits on the edge of a
 * section and paints the *next* section's colour as a layered wave, so blocks
 * of colour meet in moving water instead of a straight line. The section using
 * it must be `relative`.
 */

type Tone = "white" | "river" | "sand" | "ink";

const TONES: Record<Tone, string> = {
  white: "text-white",
  river: "text-river-50",
  sand: "text-sand-50",
  ink: "text-river-950",
};

export function WaveDivider({
  fill = "white",
  position = "bottom",
  className = "",
}: {
  /** Colour of the wave — normally the section it leads into. */
  fill?: Tone;
  /** `bottom` sits on a section's lower edge, `top` on its upper edge. */
  position?: "bottom" | "top";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-x-0 z-10 h-12 sm:h-20",
        position === "bottom" ? "bottom-0" : "top-0 rotate-180",
        TONES[fill],
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="size-full"
        fill="currentColor"
      >
        <path
          opacity="0.35"
          d="M0 58c150 44 300 12 450-14s300-46 450-10 300 58 450 22 90-14 90-14v78H0Z"
        />
        <path
          opacity="0.6"
          d="M0 82c170 18 320-40 480-40s290 52 450 44 300-44 510-20v54H0Z"
        />
        <path d="M0 104c190-6 330-32 500-30s300 34 470 30 320-24 470-16v32H0Z" />
      </svg>
    </div>
  );
}

/** A short wave stroke used under section headings, like water under a raft. */
export function SplashUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 16"
      className={["mt-3 h-3.5 w-28", className].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M2 10c14-9 26-9 40 0s26 9 40 0 26-9 40 0 26 9 40 0" />
    </svg>
  );
}

/** Three droplets, used as a small brand mark in text blocks. */
export function Droplets({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 24"
      className={["h-5 w-14", className].join(" ")}
      fill="currentColor"
    >
      <path d="M8 0c2.6 4.6 5 8 5 11a5 5 0 0 1-10 0c0-3 2.4-6.4 5-11Z" />
      <path d="M32 4c2.1 3.7 4 6.5 4 8.9a4 4 0 0 1-8 0c0-2.4 1.9-5.2 4-8.9Z" />
      <path d="M54 1c2.4 4.2 4.6 7.3 4.6 10a4.6 4.6 0 0 1-9.2 0c0-2.7 2.2-5.8 4.6-10Z" />
    </svg>
  );
}
