"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { IntakeQuestion, IntakeQuestionType } from "@/lib/intake";
import { MAX_INTAKE_QUESTIONS } from "@/lib/intake";
import { DashboardSelect, DashboardSwitch, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { dashboardOutlineActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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
        <p className="text-sm font-medium text-foreground">Booking questions</p>
        <p className="text-xs text-muted-foreground">
          Ask clients for details when they book (e.g. reason for visit, new or returning).
          Shown on your booking page — <span className="font-medium">Pro plan</span>.
        </p>
      </div>

      {questions.length > 0 && (
        <ul className="space-y-3">
          {questions.map((q, index) => (
            <li key={q.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <DashboardTextField
                  label="Question"
                  hideLabel
                  className="flex-1"
                  value={q.label}
                  onChange={(label) => update(index, { label })}
                  placeholder="Question (e.g. Reason for your visit?)"
                />
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove question"
                  onClick={() => remove(index)}
                  className="shrink-0 rounded-md px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <DashboardSelect
                  label="Answer type"
                  hideLabel
                  value={q.type}
                  onChange={(type) =>
                    update(index, { type, options: type === "select" ? (q.options ?? [""]) : undefined })
                  }
                  options={TYPE_OPTIONS}
                />
                <div className="flex items-center gap-5 sm:justify-end">
                  <DashboardSwitch
                    label="Required"
                    isSelected={q.required}
                    onChange={(required) => update(index, { required })}
                  />
                  <DashboardSwitch
                    label="Sensitive"
                    isSelected={!!q.sensitive}
                    onChange={(sensitive) => update(index, { sensitive })}
                  />
                </div>
              </div>

              {q.type === "select" && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Options</p>
                  {(q.options ?? []).map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <DashboardTextField
                        label={`Option ${optIndex + 1}`}
                        hideLabel
                        className="flex-1"
                        value={opt}
                        onChange={(next) => {
                          const options = [...(q.options ?? [])];
                          options[optIndex] = next;
                          update(index, { options });
                        }}
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      <button
                        type="button"
                        aria-label="Remove option"
                        onClick={() => update(index, { options: (q.options ?? []).filter((_, i) => i !== optIndex) })}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update(index, { options: [...(q.options ?? []), ""] })}
                    className={cn(dashboardOutlineActionClass, "h-8 px-3 text-xs")}
                  >
                    <Plus className="size-3.5" />
                    Add option
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {questions.length < MAX_INTAKE_QUESTIONS && (
        <button type="button" onClick={add} className={cn(dashboardOutlineActionClass, "h-9 px-3.5 text-sm")}>
          <Plus className="size-4" />
          Add a question
        </button>
      )}
    </div>
  );
}
