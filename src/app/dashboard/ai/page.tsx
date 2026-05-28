import { ProGate } from "@/components/ProGate";
import AiHubClient from "./AiHubClient";

export default async function AiHubPage() {
  return (
    <ProGate feature="aiBookingAutopilot">
      <AiHubClient />
    </ProGate>
  );
}
