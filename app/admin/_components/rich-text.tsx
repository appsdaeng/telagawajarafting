"use client";

import { useEffect, useRef, useState } from "react";
import { labelClass } from "@/app/admin/_components/ui";

type Row = { id: number; html: string };

const toolbarButton =
  "grid size-8 place-items-center rounded-md border border-river-200 bg-white text-xs font-semibold text-river-800 transition-colors hover:bg-river-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river-600";

const editorRowClass =
  "rich-text min-h-9 flex-1 rounded-md px-2 py-1.5 text-sm leading-relaxed text-river-950 outline-none";

type RichTextFieldProps = {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  defaultValue?: string | string[];
  /**
   * `true` stores one editable item per line (paragraphs, list items).
   * `false` stores a single paragraph.
   */
  multiple?: boolean;
  addLabel?: string;
};

/**
 * Lightweight rich text editor for the admin tour form. It runs on the
 * browser's own editing commands, so there is no editor dependency and the
 * value posts back as plain HTML in the field's usual `name`.
 */
export function RichTextField({
  name,
  label,
  hint,
  placeholder,
  defaultValue,
  multiple = false,
  addLabel = "Add line",
}: RichTextFieldProps) {
  const initial = Array.isArray(defaultValue) ? defaultValue : [defaultValue ?? ""];
  const [rows, setRows] = useState<Row[]>(() =>
    initial.length > 0
      ? initial.map((html, index) => ({ id: index, html }))
      : [{ id: 0, html: "" }],
  );
  // Set by add/remove below; the effect moves the caret once the row exists.
  const pendingFocus = useRef<number | null>(null);
  const nextId = useRef(initial.length);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;

    if (target === null) return;

    const editor = containerRef.current?.querySelector<HTMLElement>(`[data-row="${target}"]`);

    if (!editor) return;

    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [rows]);

  const update = (id: number, html: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, html } : row)));
  };

  const addRowAfter = (id: number) => {
    const newRow = { id: nextId.current++, html: "" };

    setRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      const next = [...current];
      next.splice(index + 1, 0, newRow);
      return next;
    });
    pendingFocus.current = newRow.id;
  };

  const removeRow = (id: number) => {
    if (rows.length < 2) return;

    const index = rows.findIndex((row) => row.id === id);
    const remaining = rows.filter((row) => row.id !== id);
    const previous = remaining[Math.max(0, index - 1)];

    setRows(remaining);
    if (previous) pendingFocus.current = previous.id;
  };

  const command = (name: string) => {
    if (name === "createLink") {
      const url = window.prompt("Link address", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
      return;
    }

    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(name, false);
  };

  const value = rows
    .map((row) => row.html)
    .join("\n")
    .trim();

  return (
    <div className="block">
      <span className={labelClass}>{label}</span>

      <div className="mt-1 rounded-lg border border-river-200 bg-white shadow-sm focus-within:border-river-500 focus-within:ring-2 focus-within:ring-river-200">
        <div className="flex flex-wrap items-center gap-1 border-b border-river-100 bg-river-50/70 px-1.5 py-1">
          {[
            { label: "B", title: "Bold", name: "bold", className: "font-bold" },
            { label: "I", title: "Italic", name: "italic", className: "italic" },
            { label: "U", title: "Underline", name: "underline", className: "underline" },
          ].map((item) => (
            <button
              key={item.name}
              type="button"
              title={item.title}
              aria-label={item.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command(item.name)}
              className={`${toolbarButton} ${item.className}`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            title="Bullet list"
            aria-label="Bullet list"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("insertUnorderedList")}
            className={toolbarButton}
          >
            •
          </button>
          <button
            type="button"
            title="Numbered list"
            aria-label="Numbered list"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("insertOrderedList")}
            className={toolbarButton}
          >
            1.
          </button>
          <button
            type="button"
            title="Insert link"
            aria-label="Insert link"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("createLink")}
            className={toolbarButton}
          >
            🔗
          </button>
          <button
            type="button"
            title="Remove formatting"
            aria-label="Remove formatting"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              document.execCommand("unlink", false);
              document.execCommand("removeFormat", false);
            }}
            className={toolbarButton}
          >
            ⌫
          </button>
        </div>

        <div ref={containerRef} className="space-y-1 p-1.5">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-start gap-1">
              {multiple ? (
                <span
                  aria-hidden="true"
                  className="mt-2 w-4 shrink-0 text-right text-xs text-river-400"
                >
                  {index + 1}
                </span>
              ) : null}

              <div
                role="textbox"
                aria-multiline={multiple}
                aria-label={label}
                contentEditable
                suppressContentEditableWarning
                data-row={row.id}
                data-placeholder={placeholder ?? (multiple ? addLabel : undefined)}
                className={editorRowClass}
                ref={(element) => {
                  if (element && !element.dataset.filled) {
                    element.innerHTML = row.html;
                    element.dataset.filled = "1";
                  }
                }}
                onInput={(event) => update(row.id, event.currentTarget.innerHTML)}
                onPaste={(event) => {
                  event.preventDefault();
                  const text = event.clipboardData.getData("text/plain");
                  document.execCommand("insertText", false, text);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (multiple) addRowAfter(row.id);
                    return;
                  }

                  if (
                    event.key === "Backspace" &&
                    multiple &&
                    rows.length > 1 &&
                    event.currentTarget.textContent === ""
                  ) {
                    event.preventDefault();
                    removeRow(row.id);
                  }
                }}
              />

              {multiple && rows.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove line ${index + 1}`}
                  title="Remove line"
                  onClick={() => removeRow(row.id)}
                  className="mt-1 grid size-7 shrink-0 place-items-center rounded-md text-xs text-river-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {multiple ? (
          <div className="border-t border-river-100 px-2 py-1.5">
            <button
              type="button"
              onClick={() => addRowAfter(rows[rows.length - 1]?.id ?? 0)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-river-700 transition-colors hover:bg-river-50"
            >
              + {addLabel}
            </button>
          </div>
        ) : null}
      </div>

      <input type="hidden" name={name} value={value} readOnly />

      {hint ? <span className="mt-1 block text-xs text-river-500">{hint}</span> : null}
    </div>
  );
}
