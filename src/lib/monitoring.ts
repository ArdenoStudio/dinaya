import { trackPlatformEvent } from "@/lib/platform-events";

type MonitoringContext = {
  businessId?: string | null;
  component?: string;
  extra?: Record<string, unknown>;
  fingerprint?: string;
  userId?: string | null;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

export async function captureException(error: unknown, context: MonitoringContext = {}): Promise<void> {
  console.error("[monitoring]", context.component ?? "exception", error);

  await trackPlatformEvent({
    businessId: context.businessId,
    event: "system.error",
    props: {
      component: context.component,
      extra: context.extra ? JSON.stringify(context.extra).slice(0, 4000) : undefined,
      fingerprint: context.fingerprint,
      message: errorMessage(error),
      stack: errorStack(error)?.slice(0, 4000),
    },
    userId: context.userId,
  });
}

export async function captureMessage(message: string, context: MonitoringContext = {}): Promise<void> {
  await captureException(new Error(message), context);
}
