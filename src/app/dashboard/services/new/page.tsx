"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntakeQuestionsEditor } from "@/components/dashboard/IntakeQuestionsEditor";
import { PriceVariantsEditor } from "@/components/dashboard/PriceVariantsEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardSelect,
  DashboardSwitch,
  DashboardTextAreaField,
  DashboardTextField,
} from "@/components/dashboard/DashboardFormField";
import { submitResource } from "@/lib/dashboard/use-resource";
import type { IntakeQuestion } from "@/lib/intake";
import { minPriceVariantLkr, type ServicePriceVariant } from "@/lib/service-variants";
import {
  dashboardErrorAlertClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60].map((m) => ({
  value: String(m),
  label: m === 0 ? "No buffer" : `${m} min`,
}));

const NOTICE_OPTIONS = [0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => ({
  value: String(h),
  label: h === 0 ? "No minimum" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`,
}));

const ADVANCE_OPTIONS: [number, string][] = [
  [0, "No limit"],
  [7, "1 week"],
  [14, "2 weeks"],
  [30, "1 month"],
  [60, "2 months"],
  [90, "3 months"],
  [180, "6 months"],
  [365, "1 year"],
];

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    priceLkr: 0,
    requiresPayment: false,
    depositPercent: 0,
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
    dailyCapacity: "" as string | number,
    maximumAdvanceDays: 0,
    intakeQuestions: [] as IntakeQuestion[],
    priceVariants: [] as ServicePriceVariant[],
    successRedirectUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitResource(
      "/api/dashboard/services",
      {
        ...form,
        dailyCapacity: form.dailyCapacity === "" ? null : Number(form.dailyCapacity),
        maximumAdvanceDays: form.maximumAdvanceDays || null,
      },
      "POST",
    );

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/services");
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="New service"
        backHref="/dashboard/services"
        backLabel="Services"
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
        <DashboardTextField
          label="Service name"
          isRequired
          value={form.name}
          onChange={(value) => setForm((f) => ({ ...f, name: value }))}
          placeholder="e.g. Haircut"
        />

        <DashboardTextAreaField
          label="Description"
          value={form.description}
          onChange={(value) => setForm((f) => ({ ...f, description: value }))}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <DashboardTextField
            label="Duration (minutes)"
            isRequired
            type="number"
            min={5}
            max={480}
            value={String(form.durationMinutes)}
            onChange={(value) => setForm((f) => ({ ...f, durationMinutes: parseInt(value) || 0 }))}
          />
          <div>
            <DashboardTextField
              label="Price (LKR)"
              type="number"
              min={0}
              value={String(form.priceLkr)}
              onChange={(value) => setForm((f) => ({ ...f, priceLkr: parseInt(value) || 0 }))}
            />
            {form.priceVariants.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Only shown as a fallback — clients pick from your price options below.
              </p>
            )}
          </div>
        </div>

        <PriceVariantsEditor
          value={form.priceVariants}
          onChange={(priceVariants) =>
            setForm((f) => {
              const min = minPriceVariantLkr(priceVariants);
              return { ...f, priceVariants, priceLkr: min ?? f.priceLkr };
            })
          }
        />

        <div>
          <label className={dashboardLabelClass}>Buffer time</label>
          <p className="text-xs text-muted-foreground mb-2">Block time before/after each appointment for prep or cleanup.</p>
          <div className="grid grid-cols-2 gap-4">
            <DashboardSelect
              label="Before"
              value={String(form.beforeBuffer)}
              onChange={(value) => setForm((f) => ({ ...f, beforeBuffer: parseInt(value) }))}
              options={BUFFER_OPTIONS}
            />
            <DashboardSelect
              label="After"
              value={String(form.afterBuffer)}
              onChange={(value) => setForm((f) => ({ ...f, afterBuffer: parseInt(value) }))}
              options={BUFFER_OPTIONS}
            />
          </div>
        </div>

        <DashboardSelect
          label="Minimum notice"
          hint="How far in advance must clients book?"
          value={String(form.minimumNoticeHours)}
          onChange={(value) => setForm((f) => ({ ...f, minimumNoticeHours: parseInt(value) }))}
          options={NOTICE_OPTIONS}
        />

        <DashboardTextField
          label="Daily capacity"
          hint="Max bookings per staff per day for this service. Leave blank for unlimited."
          type="number"
          min={1}
          max={100}
          value={String(form.dailyCapacity)}
          onChange={(value) => setForm((f) => ({ ...f, dailyCapacity: value }))}
          placeholder="Unlimited"
        />

        <DashboardSelect
          label="Booking window"
          hint="How far ahead can clients book this service?"
          value={String(form.maximumAdvanceDays)}
          onChange={(value) => setForm((f) => ({ ...f, maximumAdvanceDays: parseInt(value) }))}
          options={ADVANCE_OPTIONS.map(([d, labelText]) => ({ value: String(d), label: labelText }))}
        />

        <IntakeQuestionsEditor
          value={form.intakeQuestions}
          onChange={(intakeQuestions) => setForm((f) => ({ ...f, intakeQuestions }))}
        />

        <DashboardTextField
          label="Success redirect URL"
          hint="Optional. Send clients here after booking (https:// URL or path like /thank-you)."
          value={form.successRedirectUrl}
          onChange={(value) => setForm((f) => ({ ...f, successRedirectUrl: value }))}
          placeholder="https://example.com/thank-you or /thank-you"
        />

        <DashboardSwitch
          label="Require online payment at booking"
          isSelected={form.requiresPayment}
          onChange={(isSelected) => setForm((f) => ({ ...f, requiresPayment: isSelected }))}
        />

        {form.requiresPayment && (
          <DashboardTextField
            label="Deposit percentage"
            hint="Use 0 for full payment, or collect a smaller deposit to reduce no-shows."
            type="number"
            min={0}
            max={100}
            value={String(form.depositPercent)}
            onChange={(value) =>
              setForm((f) => ({ ...f, depositPercent: Math.min(100, Math.max(0, parseInt(value) || 0)) }))
            }
          />
        )}

        {error && <p className={dashboardErrorAlertClass}>{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={cn(dashboardPrimaryActionClass, "ml-auto")}>
            {loading ? "Saving…" : "Save service"}
          </button>
        </div>
      </form>
    </div>
  );
}
