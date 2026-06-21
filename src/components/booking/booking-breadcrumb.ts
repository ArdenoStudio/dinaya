import type { BookingCopy } from "@/lib/i18n";
import type { BookingBreadcrumbItem } from "./BookingBreadcrumb";
import type { BookingService } from "./BookingWizard";

type BuildBookingBreadcrumbInput = {
  copy: BookingCopy;
  service: BookingService;
  showContactForm: boolean;
  hubHref?: string | null;
  lockServiceSelection: boolean;
  multiService: boolean;
  onBackToServices: () => void;
  onBackToDateTime: () => void;
};

export function buildBookingBreadcrumbItems({
  copy,
  service,
  showContactForm,
  hubHref,
  lockServiceSelection,
  multiService,
  onBackToServices,
  onBackToDateTime,
}: BuildBookingBreadcrumbInput): BookingBreadcrumbItem[] {
  const items: BookingBreadcrumbItem[] = [];

  if (hubHref) {
    items.push({ label: copy.allServices, href: hubHref });
  } else if (!lockServiceSelection && multiService) {
    items.push({ label: copy.chooseService, onClick: onBackToServices });
  }

  if (showContactForm) {
    items.push({ label: copy.dateTime, onClick: onBackToDateTime });
    items.push({ label: copy.details, current: true });
    return items;
  }

  items.push({ label: service.name, current: true });
  return items;
}
