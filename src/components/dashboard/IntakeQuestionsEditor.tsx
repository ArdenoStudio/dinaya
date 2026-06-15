"use client";

import type { IntakeQuestion, IntakeQuestionType } from "@/lib/intake";
import { MAX_INTAKE_QUESTIONS } from "@/lib/intake";

interface Props {
  value: IntakeQuestion[];
  onChange: (questions: IntakeQuestion[]) => void;
}

const TYPE_OPTIONS: { value: IntakeQuestionType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Choose one" },
  { value: "boolean", label: "Yes / No" },
];

function newId(): string {
  // Browser-only component, so crypto.randomUUID is available.
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `q_${Math.round(performance.now() * 1000)}`;
}

const inputCls =
  "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export function IntakeQuestionsEditor({ value, onChange }: Props) {
  const questions = value ?? [];

  function update(index: number, patch: Partial<IntakeQuestion>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function remove(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    if (questions.length >= MAX_INTAKE_QUESTIONS) return;
    onChange([
      ...questions,
      { id: newId(), label: "", type: "text", required: false },
    ]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Booking questions</label>
        <p className="text-xs text-muted-foreground">
          Ask clients for details when they book (e.g. reason for visit, new or returning).
          Shown on your booking page — <span className="font-medium">Pro plan</span>.
        </p>
      </div>

      {questions.length > 0 && (
        <ul className="space-y-3">
          {questions.map((q, index) => (
            <li key={q.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  value={q.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="Question (e.g. Reason for your visit?)"
                  className={inputCls}
                />
                <div className="flex shrink-0 flex-col">
                  <button type="button" aria-label="Move up" onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                  <button type="button" aria-label="Move down" onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    className="px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                </div>
                <button type="button" aria-label="Remove question" onClick={() => remove(index)}
                  className="shrink-0 px-2 py-1 text-xs text-destructive hover:underline">Remove</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as IntakeQuestionType;
                    update(index, { type, options: type === "select" ? q.options ?? [""] : undefined });
                  }}
                  className={inputCls}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={q.required}
                      onChange={(e) => update(index, { required: e.target.checked })} className="rounded" />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={!!q.sensitive}
                      onChange={(e) => update(index, { sensitive: e.target.checked })} className="rounded" />
                    Sensitive
                  </label>
                </div>
              </div>

              {q.type === "select" && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Options</p>
                  {(q.options ?? []).map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const options = [...(q.options ?? [])];
                          options[optIndex] = e.target.value;
                          update(index, { options });
                        }}
                        placeholder={`Option ${optIndex + 1}`}
                        className={inputCls}
                      />
                      <button type="button" aria-label="Remove option"
                        onClick={() => update(index, { options: (q.options ?? []).filter((_, i) => i !== optIndex) })}
                        className="shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => update(index, { options: [...(q.options ?? []), ""] })}
                    className="text-xs text-primary hover:underline">+ Add option</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {questions.length < MAX_INTAKE_QUESTIONS && (
        <button type="button" onClick={add}
          className="text-sm text-primary hover:underline">+ Add a question</button>
      )}
    </div>
  );
}
