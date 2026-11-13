"use client";

import { useRef, useState } from "react";

type Step = {
  id: number;
  time: string;
  title: string;
  description: string;
};

// Each field has its own class: putting two width utilities (w-full and w-20)
// on one element is not reliable, because CSS order decides the winner, not the
// order they are written in the class attribute.
const timeInputClass =
  "w-20 shrink-0 rounded-lg border border-river-200 bg-white px-2 py-2 text-center text-sm tabular-nums text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200";
const titleInputClass =
  "min-w-0 flex-1 rounded-lg border border-river-200 bg-white px-3 py-2 text-sm text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200";
const toolbarButton =
  "grid h-7 min-w-7 place-items-center rounded-md border border-river-200 bg-white px-1.5 text-xs font-semibold text-river-800 transition-colors hover:bg-river-100";

const TOOLS = [
  { label: "B", title: "Bold", command: "bold", className: "font-bold" },
  { label: "I", title: "Italic", command: "italic", className: "italic" },
  { label: "U", title: "Underline", command: "underline", className: "underline" },
  { label: "S", title: "Strikethrough", command: "strikeThrough", className: "line-through" },
  { label: "• List", title: "Bullet list", command: "insertUnorderedList", className: "" },
  { label: "1. List", title: "Numbered list", command: "insertOrderedList", className: "" },
  { label: "🔗", title: "Insert link", command: "createLink", className: "" },
  { label: "✕ₐ", title: "Clear formatting", command: "removeFormat", className: "" },
];

function strip(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Recover the three fields from a step stored by an older save, where the
 * whole step was one HTML string starting with the time.
 */
function parseStep(value: unknown): { time: string; title: string; description: string } {
  let rest = (typeof value === "string" ? value : String(value ?? "")).trim();
  let time = "";

  const found = /^(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*:?\s*/i.exec(rest);

  if (found) {
    time = found[1];
    rest = rest.slice(found[0].length);
  }

  const strong = /^<(?:strong|b)>\s*([\s\S]*?)\s*<\/(?:strong|b)>\s*/i.exec(rest);
  let title = "";

  if (strong) {
    title = strip(strong[1]);
    rest = rest.slice(strong[0].length);
  }

  const firstBlock = /^<p\b[^>]*>([\s\S]*?)<\/p>\s*/i.exec(rest);

  if (!title && firstBlock) {
    title = strip(firstBlock[1]);
    rest = rest.slice(firstBlock[0].length);
  } else if (!title && !firstBlock) {
    title = strip(rest);
    rest = "";
  }

  // The join between title and description is a <br> (or a block element when
  // the description starts with a list).
  return { time, title, description: rest.replace(/^(?:<br\s*\/?>\s*)+/i, "").trim() };
}

/**
 * A multi-line description with inline formatting and real bullet/numbered
 * lists. Enter adds a line break, except inside a list, where the browser
 * starts the next bullet.
 */
function DescriptionEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

  const command = (name: string) => {
    if (name === "createLink") {
      const url = window.prompt("Link address", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
      sync();
      return;
    }

    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(name, false);
    sync();
  };

  return (
    <div className="mt-2 rounded-lg border border-river-200 bg-white shadow-sm focus-within:border-river-500 focus-within:ring-2 focus-within:ring-river-200">
      <div className="flex flex-wrap items-center gap-1 border-b border-river-100 bg-river-50/60 px-1.5 py-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(tool.command)}
            className={`${toolbarButton} ${tool.className}`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={(element) => {
          ref.current = element;

          // Uncontrolled on purpose: writing innerHTML on every render would
          // move the caret back to the start while the operator types.
          if (element && !element.dataset.filled) {
            element.innerHTML = value;
            element.dataset.filled = "1";
          }
        }}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Our driver collects you from your hotel… Use • List for the included gear."
        className="rich-text min-h-24 max-h-72 overflow-y-auto px-3 py-2 text-sm leading-relaxed text-river-950 outline-none"
        onInput={sync}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;

          const selection = window.getSelection();
          const node = selection?.anchorNode;
          const element =
            node instanceof Element ? node : (node?.parentElement ?? null);

          // Inside a list the browser adds the next bullet itself.
          if (element?.closest("li")) return;

          event.preventDefault();
          document.execCommand("insertHTML", false, "<br>");
          sync();
        }}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
        }}
      />
    </div>
  );
}

/**
 * Itinerary steps: a time the operator types by hand (08:00, Day 1 08:00…), a
 * title and a multi-line description with formatting and lists.
 *
 * The steps post as JSON in `itinerary_steps`, and the save action turns each
 * one into a single entry of the `itinerary` column. Sending structured data
 * (rather than one HTML document) is what lets a description keep its bullets
 * instead of being split into extra steps.
 */
export function ItineraryField({ defaultValue }: { defaultValue?: string[] | null }) {
  // Whatever the column holds (an older save, a null entry, a stray non-array
  // value), the editor must still open: coerce instead of trusting the type.
  const initial = (Array.isArray(defaultValue) ? defaultValue : []).map((html, index) => ({
    id: index,
    ...parseStep(html),
  }));

  const [steps, setSteps] = useState<Step[]>(
    initial.length > 0 ? initial : [{ id: 0, time: "", title: "", description: "" }],
  );
  // With no saved steps the list still starts with one empty card, so the
  // first added step must not reuse its id.
  const nextId = useRef(Math.max(initial.length, 1));
  const [dragging, setDragging] = useState<number | null>(null);

  const patch = (id: number, values: Partial<Step>) => {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...values } : step)));
  };

  const addStep = () => {
    const step = { id: nextId.current++, time: "", title: "", description: "" };
    setSteps((current) => [...current, step]);
  };

  const removeStep = (id: number) => {
    setSteps((current) => (current.length > 1 ? current.filter((step) => step.id !== id) : current));
  };

  const move = (from: number, to: number) => {
    setSteps((current) => {
      if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const payload = JSON.stringify(
    steps
      .filter((step) => step.time.trim() || step.title.trim() || strip(step.description))
      .map((step) => ({
        time: step.time.trim(),
        title: step.title.trim(),
        description: step.description.trim(),
      })),
  );

  return (
    <div className="block">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-river-700">Itinerary</span>
          <p className="mt-1 text-xs text-river-500">
            One card per step. Type the time by hand — 08:00, or Day 1 · 08:00 when the tour runs
            over several days. The description is multi-line: use the toolbar for bold, italics and
            bullet or numbered lists. Drag the handle to reorder.
          </p>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-1.5 rounded-lg border border-river-200 bg-white px-3 py-2 text-xs font-semibold text-river-800 transition-colors hover:bg-river-50"
        >
          + Add step
        </button>
      </div>

      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging !== null) move(dragging, index);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
            className={`rounded-xl border bg-white p-3 transition-colors ${
              dragging === index ? "border-river-400 opacity-60" : "border-river-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                title="Drag to reorder"
                className="cursor-grab select-none px-0.5 text-xs tracking-tighter text-river-300"
              >
                ⋮⋮
              </span>

              <input
                value={step.time}
                onChange={(event) => patch(step.id, { time: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder="08:00"
                aria-label={`Time for step ${index + 1}`}
                className={timeInputClass}
              />

              <input
                value={step.title}
                onChange={(event) => patch(step.id, { title: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder="Hotel pickup"
                aria-label={`Title for step ${index + 1}`}
                className={titleInputClass}
              />

              <button
                type="button"
                aria-label={`Remove step ${index + 1}`}
                title="Remove step"
                onClick={() => removeStep(step.id)}
                className="grid size-7 shrink-0 place-items-center rounded-md text-river-400 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                ✕
              </button>
            </div>

            <DescriptionEditor
              value={step.description}
              onChange={(html) => patch(step.id, { description: html })}
              label={`Description for step ${index + 1}`}
            />
          </li>
        ))}
      </ol>

      <input type="hidden" name="itinerary_steps" value={payload} readOnly />
    </div>
  );
}
