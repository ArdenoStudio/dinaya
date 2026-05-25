import { generateAiCopy } from "@/lib/ai/copy";

type DealSuggestionCopyInput = {
  businessName: string;
  serviceName: string;
  staffName: string;
  gapMinutes: number;
  suggestedDiscountPercent: number;
  reason: string;
};

export async function generateDealSuggestionCopy(
  input: DealSuggestionCopyInput,
): Promise<{ headline: string }> {
  const copy = await generateAiCopy({
    businessName: input.businessName,
    feature: "aiDealSuggestions",
    serviceName: input.serviceName,
    staffName: input.staffName,
    extra: `${input.reason} Suggested discount: ${input.suggestedDiscountPercent}%.`,
  });

  return {
    headline: copy.body.length > 20 ? copy.body : input.reason,
  };
}
