import { after } from "next/server";

export function runAfterResponse(label: string, task: () => Promise<void>): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error(`[after-response] ${label} failed`, error);
    }
  });
}

export function logRejectedSettled(label: string, results: PromiseSettledResult<unknown>[]): void {
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(`[after-response] ${label} failed`, result.reason);
    }
  }
}
