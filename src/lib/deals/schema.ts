import { z } from "@/lib/validation";

export const dealCreateSchema = z.object({
  serviceId: z.uuid(),
  locationId: z.uuid(),
  staffId: z.uuid().optional().nullable(),
  discountPercent: z.number().int().min(10).max(50),
  slotsTotal: z.number().int().min(1).max(20),
  dealWindowStart: z.iso.datetime(),
  dealWindowEnd: z.iso.datetime(),
  apptWindowStart: z.iso.datetime(),
  apptWindowEnd: z.iso.datetime(),
  notifyClients: z.boolean().optional().default(false),
}).refine(
  (data) => new Date(data.dealWindowEnd) > new Date(data.dealWindowStart),
  { message: "Deal end must be after deal start.", path: ["dealWindowEnd"] },
).refine(
  (data) => new Date(data.apptWindowEnd) > new Date(data.apptWindowStart),
  { message: "Appointment end must be after appointment start.", path: ["apptWindowEnd"] },
);

export type DealCreateInput = z.infer<typeof dealCreateSchema>;

export const dealCancelSchema = z.object({
  status: z.literal("cancelled"),
});
