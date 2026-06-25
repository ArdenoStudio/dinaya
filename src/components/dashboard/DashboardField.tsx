import { cn } from "@/lib/utils";
import { dashboardInputClass, dashboardLabelClass } from "@/lib/dashboard-ui";

type DashboardFieldProps = {
  children: React.ReactNode;
  className?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
};

export function DashboardField({
  children,
  className,
  hint,
  htmlFor,
  label,
  optional,
  required,
}: DashboardFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={dashboardLabelClass}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </label>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className={hint ? "mt-2" : "mt-1"}>{children}</div>
    </div>
  );
}

export function DashboardInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(dashboardInputClass, "mt-0", className)} {...props} />;
}

export function DashboardTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(dashboardInputClass, "mt-0 min-h-[6rem] resize-y", className)}
      {...props}
    />
  );
}
